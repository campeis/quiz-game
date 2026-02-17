use std::sync::Arc;
use std::time::Instant;

use serde_json::json;
use tokio::sync::{broadcast, RwLock};
use tokio::time::{sleep, Duration};

use crate::models::leaderboard::compute_leaderboard;
use crate::models::player::{Answer, Player};
use crate::models::session::{GameSession, SessionStatus};
use crate::services::scoring::calculate_points;

/// Message that can be sent through the broadcast channel.
#[derive(Debug, Clone)]
pub enum GameEvent {
    /// Broadcast to all participants (host + players)
    BroadcastAll(String),
    /// Send only to host
    HostOnly(String),
    /// Send to a specific player
    PlayerOnly { player_id: String, message: String },
}

pub async fn start_game(
    session: Arc<RwLock<GameSession>>,
    tx: broadcast::Sender<GameEvent>,
    question_time_sec: u64,
) {
    {
        let mut s = session.write().await;
        s.status = SessionStatus::Active;
    }

    let total_questions = session.read().await.total_questions();

    let _ = tx.send(GameEvent::BroadcastAll(
        json!({
            "type": "game_starting",
            "payload": {
                "countdown_sec": 3,
                "total_questions": total_questions,
            }
        })
        .to_string(),
    ));

    sleep(Duration::from_secs(3)).await;

    send_next_question(session, tx, question_time_sec);
}

/// Spawns a task to send the next question (non-recursive, breaks the cycle).
fn send_next_question(
    session: Arc<RwLock<GameSession>>,
    tx: broadcast::Sender<GameEvent>,
    question_time_sec: u64,
) {
    tokio::spawn(async move {
        do_advance_question(session, tx, question_time_sec).await;
    });
}

async fn do_advance_question(
    session: Arc<RwLock<GameSession>>,
    tx: broadcast::Sender<GameEvent>,
    question_time_sec: u64,
) {
    let question_index = {
        let mut s = session.write().await;
        s.current_question += 1;
        let idx = s.current_question as usize;

        if idx >= s.quiz.questions.len() {
            broadcast_game_finished(&s, &tx);
            s.status = SessionStatus::Finished;
            return;
        }

        s.question_started = Some(Instant::now());
        let q = &s.quiz.questions[idx];
        let options: Vec<String> = q.options.iter().map(|o| o.text.clone()).collect();

        let _ = tx.send(GameEvent::BroadcastAll(
            json!({
                "type": "question",
                "payload": {
                    "question_index": idx,
                    "total_questions": s.quiz.questions.len(),
                    "text": q.text,
                    "options": options,
                    "time_limit_sec": q.time_limit_sec,
                }
            })
            .to_string(),
        ));

        idx
    };

    // Start question timer
    let timer_session = session.clone();
    let timer_tx = tx.clone();
    tokio::spawn(async move {
        sleep(Duration::from_secs(question_time_sec)).await;

        let current = timer_session.read().await.current_question;
        if current as usize == question_index {
            do_end_question(timer_session, timer_tx, question_time_sec, question_index).await;
        }
    });
}

pub async fn handle_answer(
    session: &Arc<RwLock<GameSession>>,
    tx: &broadcast::Sender<GameEvent>,
    question_time_sec: u64,
    player_id: &str,
    question_index: usize,
    selected_index: usize,
) {
    let all_answered = {
        let mut s = session.write().await;

        if s.current_question as usize != question_index {
            let _ = tx.send(GameEvent::PlayerOnly {
                player_id: player_id.to_string(),
                message: json!({
                    "type": "error",
                    "payload": { "code": "wrong_question", "message": "Not the current question" }
                })
                .to_string(),
            });
            return;
        }

        let player = match s.players.get(player_id) {
            Some(p) => p,
            None => return,
        };

        if player.has_answered(question_index) {
            let _ = tx.send(GameEvent::PlayerOnly {
                player_id: player_id.to_string(),
                message: json!({
                    "type": "error",
                    "payload": { "code": "already_answered", "message": "You have already submitted an answer for this question" }
                })
                .to_string(),
            });
            return;
        }

        let question = &s.quiz.questions[question_index];
        let correct = selected_index == question.correct_index;
        let time_taken_ms = s
            .question_started
            .map(|started| started.elapsed().as_millis() as u64)
            .unwrap_or(0);

        let points = calculate_points(correct, time_taken_ms, question.time_limit_sec);
        let correct_index = question.correct_index;

        let player = s.players.get_mut(player_id).unwrap();
        player.answers.push(Answer {
            question_index,
            selected_index,
            time_taken_ms,
            points_awarded: points,
        });
        if correct {
            player.correct_count += 1;
        }
        player.score += points;

        let _ = tx.send(GameEvent::PlayerOnly {
            player_id: player_id.to_string(),
            message: json!({
                "type": "answer_result",
                "payload": {
                    "correct": correct,
                    "points_awarded": points,
                    "correct_index": correct_index,
                }
            })
            .to_string(),
        });

        let answered_count = s
            .players
            .values()
            .filter(|p| p.has_answered(question_index))
            .count();
        let total_players = s.players.len();

        let _ = tx.send(GameEvent::HostOnly(
            json!({
                "type": "answer_count",
                "payload": {
                    "answered": answered_count,
                    "total": total_players,
                }
            })
            .to_string(),
        ));

        answered_count == total_players
    };

    if all_answered {
        do_end_question(session.clone(), tx.clone(), question_time_sec, question_index).await;
    }
}

async fn do_end_question(
    session: Arc<RwLock<GameSession>>,
    tx: broadcast::Sender<GameEvent>,
    question_time_sec: u64,
    question_index: usize,
) {
    {
        let s = session.read().await;

        if s.current_question as usize != question_index {
            return;
        }

        let question = &s.quiz.questions[question_index];
        let correct_index = question.correct_index;
        let correct_text = question.options[correct_index].text.clone();

        let player_refs: Vec<&Player> = s.players.values().collect();
        let leaderboard = compute_leaderboard(&player_refs, false);

        let leaderboard_json: Vec<_> = leaderboard
            .iter()
            .map(|e| {
                json!({
                    "rank": e.rank,
                    "display_name": e.display_name,
                    "score": e.score,
                    "correct_count": e.correct_count,
                })
            })
            .collect();

        let _ = tx.send(GameEvent::BroadcastAll(
            json!({
                "type": "question_ended",
                "payload": {
                    "correct_index": correct_index,
                    "correct_text": correct_text,
                    "leaderboard": leaderboard_json,
                }
            })
            .to_string(),
        ));
    }

    sleep(Duration::from_millis(500)).await;

    // Use send_next_question to break the async recursion cycle
    send_next_question(session, tx, question_time_sec);
}

fn broadcast_game_finished(session: &GameSession, tx: &broadcast::Sender<GameEvent>) {
    let player_refs: Vec<&Player> = session.players.values().collect();
    let leaderboard = compute_leaderboard(&player_refs, true);

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

    let _ = tx.send(GameEvent::BroadcastAll(
        json!({
            "type": "game_finished",
            "payload": {
                "leaderboard": leaderboard_json,
                "total_questions": session.quiz.questions.len(),
            }
        })
        .to_string(),
    ));
}
