use std::sync::Arc;

use axum::extract::ws::Message;
use axum::extract::{Path, Query, State, WebSocketUpgrade};
use axum::response::IntoResponse;
use dashmap::DashMap;
use futures_util::{SinkExt, StreamExt};
use once_cell::sync::Lazy;
use serde::Deserialize;
use serde_json::json;
use tokio::sync::broadcast;

use crate::AppState;
use crate::models::player::{ConnectionStatus, Player};
use crate::models::session::SessionStatus;
use crate::services::game_engine::{self, GameEvent};

/// Reconnection timeout — after this, player is permanently removed.
const RECONNECT_TIMEOUT_SECS: u64 = 120;

// Global broadcast channel registry (keyed by join_code)
static BROADCAST_CHANNELS: Lazy<DashMap<String, broadcast::Sender<GameEvent>>> =
    Lazy::new(DashMap::new);

#[derive(Deserialize)]
pub struct PlayerParams {
    pub name: Option<String>,
}

/// Host WebSocket: GET /ws/host/:join_code
pub async fn ws_host(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Path(join_code): Path<String>,
) -> impl IntoResponse {
    let session = state.session_manager.get_session(&join_code);
    let question_time_sec = state.config.question_time_sec;

    ws.on_upgrade(move |socket| async move {
        let Some(session) = session else {
            return;
        };

        let is_resuming = {
            let mut s = session.write().await;
            let host_id = uuid::Uuid::new_v4().to_string();
            s.host_id = Some(host_id);
            if s.status == SessionStatus::Paused {
                s.status = SessionStatus::Active;
                true
            } else {
                false
            }
        };

        // Reuse existing broadcast channel if host is reconnecting, otherwise create new
        let tx = if let Some(existing) = BROADCAST_CHANNELS.get(&join_code) {
            Arc::new(existing.clone())
        } else {
            let (new_tx, _rx) = broadcast::channel::<GameEvent>(256);
            let new_tx = Arc::new(new_tx);
            BROADCAST_CHANNELS.insert(join_code.clone(), (*new_tx).clone());
            new_tx
        };
        let mut rx = tx.subscribe();

        if is_resuming {
            let _ = tx.send(GameEvent::BroadcastAll(
                json!({
                    "type": "game_resumed",
                    "payload": { "reason": "host_reconnected" }
                })
                .to_string(),
            ));
        }

        let (mut ws_sender, mut ws_receiver) = socket.split();

        // Forward game events to host WebSocket
        let send_task = tokio::spawn(async move {
            while let Ok(event) = rx.recv().await {
                let msg = match event {
                    GameEvent::BroadcastAll(m) => Some(m),
                    GameEvent::HostOnly(m) => Some(m),
                    GameEvent::PlayerOnly { .. } => None,
                };
                if let Some(m) = msg
                    && ws_sender.send(Message::Text(m.into())).await.is_err()
                {
                    break;
                }
            }
        });

        // Receive messages from host
        let recv_session = session.clone();
        let recv_tx = (*tx).clone();
        let recv_task = tokio::spawn(async move {
            while let Some(Ok(msg)) = ws_receiver.next().await {
                match msg {
                    Message::Text(ref text) => {
                        if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(text) {
                            match parsed["type"].as_str() {
                                Some("start_game") => {
                                    let can_start = {
                                        let s = recv_session.read().await;
                                        s.status == SessionStatus::Lobby && !s.players.is_empty()
                                    };
                                    if can_start {
                                        let s = recv_session.clone();
                                        let t = recv_tx.clone();
                                        tokio::spawn(async move {
                                            game_engine::start_game(s, t, question_time_sec).await;
                                        });
                                    }
                                }
                                Some("end_game") => {
                                    let mut s = recv_session.write().await;
                                    s.status = SessionStatus::Finished;
                                    break;
                                }
                                _ => {}
                            }
                        }
                    }
                    Message::Close(_) => break,
                    _ => {}
                }
            }
        });

        tokio::select! {
            _ = send_task => {},
            _ = recv_task => {},
        }

        // Host disconnected — pause game if active, start reconnection timeout
        let was_active = {
            let mut s = session.write().await;
            if s.status == SessionStatus::Active {
                s.status = SessionStatus::Paused;
                let _ = tx.send(GameEvent::BroadcastAll(
                    json!({
                        "type": "game_paused",
                        "payload": { "reason": "host_disconnected" }
                    })
                    .to_string(),
                ));
                true
            } else {
                false
            }
        };

        if was_active {
            // Give host time to reconnect before terminating
            let timeout_session = session.clone();
            let timeout_tx = (*tx).clone();
            let timeout_code = join_code.clone();
            tokio::spawn(async move {
                tokio::time::sleep(tokio::time::Duration::from_secs(RECONNECT_TIMEOUT_SECS)).await;
                let mut s = timeout_session.write().await;
                if s.status == SessionStatus::Paused {
                    s.status = SessionStatus::Finished;

                    let player_refs: Vec<&crate::models::player::Player> =
                        s.players.values().collect();
                    let leaderboard =
                        crate::models::leaderboard::compute_leaderboard(&player_refs, true);
                    let leaderboard_json: Vec<_> = leaderboard
                        .iter()
                        .map(|e| {
                            json!({
                                "rank": e.rank,
                                "display_name": e.display_name,
                                "score": e.score,
                                "correct_count": e.correct_count,
                                "is_winner": e.is_winner,
                            })
                        })
                        .collect();

                    let _ = timeout_tx.send(GameEvent::BroadcastAll(
                        json!({
                            "type": "game_terminated",
                            "payload": {
                                "reason": "host_timeout",
                                "leaderboard": leaderboard_json,
                                "total_questions": s.quiz.questions.len(),
                            }
                        })
                        .to_string(),
                    ));

                    BROADCAST_CHANNELS.remove(&timeout_code);
                }
            });
        } else {
            BROADCAST_CHANNELS.remove(&join_code);
        }
    })
}

/// Player WebSocket: GET /ws/player/:join_code?name=DisplayName
pub async fn ws_player(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Path(join_code): Path<String>,
    Query(params): Query<PlayerParams>,
) -> impl IntoResponse {
    let session = state.session_manager.get_session(&join_code);
    let question_time_sec = state.config.question_time_sec;

    ws.on_upgrade(move |socket| async move {
        let Some(session) = session else {
            return;
        };

        // Wait for host to set up broadcast channel
        let tx = {
            let mut attempts = 0;
            loop {
                if let Some(entry) = BROADCAST_CHANNELS.get(&join_code) {
                    break entry.clone();
                }
                attempts += 1;
                if attempts > 50 {
                    return;
                }
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            }
        };

        let requested_name = params.name.unwrap_or_else(|| "Player".to_string());

        // Subscribe before broadcasting so player receives its own join/reconnect message
        let mut rx = tx.subscribe();

        // Check for reconnection: find a disconnected player with the same display name
        let reconnect_result = {
            let mut s = session.write().await;
            let disconnected_player = s
                .players
                .iter()
                .find(|(_, p)| {
                    p.display_name == requested_name
                        && p.connection_status == ConnectionStatus::Disconnected
                })
                .map(|(id, _)| id.clone());

            if let Some(existing_id) = disconnected_player {
                if let Some(player) = s.players.get_mut(&existing_id) {
                    // Check if within reconnection window
                    let within_window = player
                        .disconnected_at
                        .map(|t| t.elapsed().as_secs() < RECONNECT_TIMEOUT_SECS)
                        .unwrap_or(false);
                    if within_window {
                        player.connection_status = ConnectionStatus::Connected;
                        player.disconnected_at = None;
                        let count = s.player_count();
                        Some((existing_id, requested_name.clone(), count))
                    } else {
                        None
                    }
                } else {
                    None
                }
            } else {
                None
            }
        };

        let (player_id, display_name, is_reconnect) =
            if let Some((existing_id, name, player_count)) = reconnect_result {
                // Broadcast reconnection
                let _ = tx.send(GameEvent::BroadcastAll(
                    json!({
                        "type": "player_reconnected",
                        "payload": {
                            "player_id": existing_id,
                            "display_name": name,
                            "player_count": player_count,
                        }
                    })
                    .to_string(),
                ));
                (existing_id, name, true)
            } else {
                // New player join
                let player_id = uuid::Uuid::new_v4().to_string();

                let (final_name, name_was_changed, player_count) = {
                    let mut s = session.write().await;
                    if !s.is_joinable() {
                        return;
                    }

                    // Ensure display name uniqueness
                    let mut final_name = requested_name.clone();
                    let existing_names: Vec<String> = s
                        .players
                        .values()
                        .filter(|p| p.connection_status != ConnectionStatus::Disconnected)
                        .map(|p| p.display_name.clone())
                        .collect();
                    if existing_names.contains(&final_name) {
                        let mut suffix = 2;
                        loop {
                            let candidate = format!("{} {}", requested_name, suffix);
                            if !existing_names.contains(&candidate) {
                                final_name = candidate;
                                break;
                            }
                            suffix += 1;
                        }
                    }

                    let name_changed = final_name != requested_name;
                    let player = Player::new(player_id.clone(), final_name.clone());
                    s.players.insert(player_id.clone(), player);
                    (final_name, name_changed, s.player_count())
                };

                // Send name_assigned if name was modified
                if name_was_changed {
                    let _ = tx.send(GameEvent::PlayerOnly {
                        player_id: player_id.clone(),
                        message: json!({
                            "type": "name_assigned",
                            "payload": {
                                "requested_name": requested_name,
                                "assigned_name": final_name,
                            }
                        })
                        .to_string(),
                    });
                }

                let _ = tx.send(GameEvent::BroadcastAll(
                    json!({
                        "type": "player_joined",
                        "payload": {
                            "player_id": player_id,
                            "display_name": final_name,
                            "player_count": player_count,
                        }
                    })
                    .to_string(),
                ));

                (player_id, final_name, false)
            };
        let _ = is_reconnect; // used in future for state restoration
        let (mut ws_sender, mut ws_receiver) = socket.split();

        // Forward game events to player WebSocket
        let pid_for_send = player_id.clone();
        let send_task = tokio::spawn(async move {
            while let Ok(event) = rx.recv().await {
                let msg = match &event {
                    GameEvent::BroadcastAll(m) => Some(m.clone()),
                    GameEvent::PlayerOnly {
                        player_id: pid,
                        message,
                    } if pid == &pid_for_send => Some(message.clone()),
                    _ => None,
                };
                if let Some(m) = msg
                    && ws_sender.send(Message::Text(m.into())).await.is_err()
                {
                    break;
                }
            }
        });

        // Receive messages from player
        let pid_for_recv = player_id.clone();
        let recv_session = session.clone();
        let recv_tx = tx.clone();
        let recv_task = tokio::spawn(async move {
            while let Some(Ok(msg)) = ws_receiver.next().await {
                match msg {
                    Message::Text(ref text) => {
                        if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(text)
                            && parsed["type"].as_str() == Some("submit_answer")
                        {
                            let qi =
                                parsed["payload"]["question_index"].as_u64().unwrap_or(0) as usize;
                            let si =
                                parsed["payload"]["selected_index"].as_u64().unwrap_or(0) as usize;
                            game_engine::handle_answer(
                                &recv_session,
                                &recv_tx,
                                question_time_sec,
                                &pid_for_recv,
                                qi,
                                si,
                            )
                            .await;
                        }
                    }
                    Message::Close(_) => break,
                    _ => {}
                }
            }
        });

        tokio::select! {
            _ = send_task => {},
            _ = recv_task => {},
        }

        // Mark player as disconnected instead of removing
        let player_count = {
            let mut s = session.write().await;
            if let Some(player) = s.players.get_mut(&player_id) {
                player.connection_status = ConnectionStatus::Disconnected;
                player.disconnected_at = Some(std::time::Instant::now());
            }
            s.player_count()
        };

        let _ = tx.send(GameEvent::BroadcastAll(
            json!({
                "type": "player_left",
                "payload": {
                    "player_id": player_id,
                    "display_name": display_name,
                    "player_count": player_count,
                    "reason": "disconnected",
                }
            })
            .to_string(),
        ));

        // Start reconnection timer — remove player if they don't reconnect
        let timeout_session = session.clone();
        let timeout_pid = player_id.clone();
        let timeout_tx = tx.clone();
        tokio::spawn(async move {
            tokio::time::sleep(tokio::time::Duration::from_secs(RECONNECT_TIMEOUT_SECS)).await;
            let mut s = timeout_session.write().await;
            if let Some(player) = s.players.get(&timeout_pid)
                && player.connection_status == ConnectionStatus::Disconnected
            {
                let name = player.display_name.clone();
                s.players.remove(&timeout_pid);
                let count = s.player_count();
                let _ = timeout_tx.send(GameEvent::BroadcastAll(
                    json!({
                        "type": "player_left",
                        "payload": {
                            "player_id": timeout_pid,
                            "display_name": name,
                            "player_count": count,
                            "reason": "timeout",
                        }
                    })
                    .to_string(),
                ));
            }
        });
    })
}
