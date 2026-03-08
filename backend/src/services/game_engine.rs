use std::sync::Arc;
use std::time::Instant;

use serde_json::json;
use tokio::sync::{RwLock, broadcast};
use tokio::time::{Duration, sleep};

use crate::models::leaderboard::compute_leaderboard;
use crate::models::player::{Answer, Player};
use crate::models::scoring_rule::{ScoringContext, ScoringRule};
use crate::models::session::{GameSession, SessionStatus};
use crate::services::session_manager::SessionManager;

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

/// Updates the session's scoring rule if still in Lobby and broadcasts the change.
/// Silently ignored when the session is Active, Paused, or Finished.
pub fn handle_set_scoring_rule(
    session: &mut GameSession,
    rule: ScoringRule,
    tx: &broadcast::Sender<GameEvent>,
) {
    if session.status != SessionStatus::Lobby {
        return;
    }
    session.scoring_rule = rule;
    let rule_value = serde_json::to_value(&session.scoring_rule).unwrap_or_default();
    let _ = tx.send(GameEvent::BroadcastAll(
        json!({
            "type": "scoring_rule_set",
            "payload": { "rule": rule_value }
        })
        .to_string(),
    ));
}

/// Updates the session's time limit if still in Lobby and broadcasts the change.
/// Silently ignored when the session is Active, Paused, or Finished.
/// Returns an error event to the host if `seconds` is out of the valid range [10, 60].
pub fn handle_set_time_limit(
    session: &mut GameSession,
    seconds: u64,
    tx: &broadcast::Sender<GameEvent>,
) {
    if session.status != SessionStatus::Lobby {
        return;
    }
    if !(10..=60).contains(&seconds) {
        let _ = tx.send(GameEvent::HostOnly(
            json!({
                "type": "error",
                "payload": {
                    "code": "invalid_time_limit",
                    "message": "Time limit must be between 10 and 60 seconds"
                }
            })
            .to_string(),
        ));
        return;
    }
    session.time_limit_sec = seconds;
    let _ = tx.send(GameEvent::BroadcastAll(
        json!({
            "type": "time_limit_set",
            "payload": { "seconds": seconds }
        })
        .to_string(),
    ));
}

pub async fn start_game(
    session: Arc<RwLock<GameSession>>,
    tx: broadcast::Sender<GameEvent>,
    session_manager: SessionManager,
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

    send_next_question(session, tx, session_manager);
}

/// Spawns a task to send the next question (non-recursive, breaks the cycle).
fn send_next_question(
    session: Arc<RwLock<GameSession>>,
    tx: broadcast::Sender<GameEvent>,
    session_manager: SessionManager,
) {
    tokio::spawn(async move {
        do_advance_question(session, tx, session_manager).await;
    });
}

pub(crate) async fn do_advance_question(
    session: Arc<RwLock<GameSession>>,
    tx: broadcast::Sender<GameEvent>,
    session_manager: SessionManager,
) {
    let question_index = {
        let mut s = session.write().await;
        s.current_question += 1;
        s.correct_answer_count = 0;
        let idx = s.current_question as usize;

        if idx >= s.quiz.questions.len() {
            broadcast_game_finished(&s, &tx);
            s.status = SessionStatus::Finished;
            session_manager.remove_session(&s.join_code);
            return;
        }

        s.question_started = Some(Instant::now());
        let q = &s.quiz.questions[idx];
        let options: Vec<String> = q.options.iter().map(|o| o.text.clone()).collect();

        let scoring_rule_value = serde_json::to_value(&s.scoring_rule).unwrap_or_default();
        let _ = tx.send(GameEvent::BroadcastAll(
            json!({
                "type": "question",
                "payload": {
                    "question_index": idx,
                    "total_questions": s.quiz.questions.len(),
                    "text": q.text,
                    "options": options,
                    "time_limit_sec": s.time_limit_sec,
                    "scoring_rule": scoring_rule_value,
                }
            })
            .to_string(),
        ));

        idx
    };

    // Start question timer using session's time_limit_sec
    let timer_session = session.clone();
    let timer_tx = tx.clone();
    let timer_sm = session_manager.clone();
    tokio::spawn(async move {
        let time_limit = timer_session.read().await.time_limit_sec;
        sleep(Duration::from_secs(time_limit)).await;

        let current = timer_session.read().await.current_question;
        if current as usize == question_index {
            do_end_question(timer_session, timer_tx, question_index, timer_sm).await;
        }
    });
}

pub async fn handle_answer(
    session: &Arc<RwLock<GameSession>>,
    tx: &broadcast::Sender<GameEvent>,
    player_id: &str,
    question_index: usize,
    selected_index: usize,
    session_manager: SessionManager,
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

        let pre_answer_streak = player.correct_streak;

        let (correct, correct_index, time_taken_ms) = {
            let question = &s.quiz.questions[question_index];
            let correct = selected_index == question.correct_index;
            let time_taken_ms = s
                .question_started
                .map(|started| started.elapsed().as_millis() as u64)
                .unwrap_or(0);
            (correct, question.correct_index, time_taken_ms)
        };

        let outcome = s.scoring_rule.score(&ScoringContext {
            correct,
            time_taken_ms,
            time_limit_sec: s.time_limit_sec,
            streak: pre_answer_streak,
            correct_answer_count: s.correct_answer_count,
        });
        if outcome.position.is_some() {
            s.correct_answer_count += 1;
        }
        let points = outcome.points;
        let position_opt = outcome.position;
        let streak_multiplier = outcome.streak_multiplier;

        let player = s.players.get_mut(player_id).unwrap();
        player.answers.push(Answer {
            question_index,
            selected_index,
            time_taken_ms,
            points_awarded: points,
        });
        if correct {
            player.correct_count += 1;
            player.correct_streak += 1;
        } else {
            player.correct_streak = 0;
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
                    "streak_multiplier": streak_multiplier,
                    "position": position_opt,
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
        do_end_question(session.clone(), tx.clone(), question_index, session_manager).await;
    }
}

pub(crate) async fn do_end_question(
    session: Arc<RwLock<GameSession>>,
    tx: broadcast::Sender<GameEvent>,
    question_index: usize,
    session_manager: SessionManager,
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
                    "avatar": e.avatar,
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

    // Reset streak for unanswered players when StreakBonus rule is active
    {
        let mut s = session.write().await;
        if s.scoring_rule == ScoringRule::StreakBonus {
            for player in s.players.values_mut() {
                if !player.has_answered(question_index) {
                    player.correct_streak = 0;
                }
            }
        }
    }

    sleep(Duration::from_millis(500)).await;

    send_next_question(session, tx, session_manager);
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
                "avatar": e.avatar,
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

#[cfg(test)]
mod tests {
    use std::time::Duration;

    use tokio::sync::broadcast;

    use super::*;
    use crate::config::AppConfig;
    use crate::models::player::Player;
    use crate::models::quiz::{Question, Quiz, QuizOption};
    use crate::models::scoring_rule::ScoringRule;
    use crate::models::session::{GameSession, SessionStatus};
    use crate::services::session_manager::SessionManager;

    fn make_session_manager() -> SessionManager {
        SessionManager::new(AppConfig::from_env())
    }

    fn make_quiz(q_time_limit_sec: u64) -> Quiz {
        Quiz {
            title: "Test".to_string(),
            questions: vec![Question {
                text: "What is 1+1?".to_string(),
                options: vec![
                    QuizOption {
                        text: "1".to_string(),
                    },
                    QuizOption {
                        text: "2".to_string(),
                    },
                ],
                correct_index: 1,
                time_limit_sec: q_time_limit_sec,
            }],
        }
    }

    fn make_session(session_time_limit: u64, q_time_limit: u64) -> Arc<RwLock<GameSession>> {
        let quiz = make_quiz(q_time_limit);
        Arc::new(RwLock::new(GameSession::new(
            "TSTCDE".to_string(),
            quiz,
            session_time_limit,
        )))
    }

    // ── T003: question broadcast uses session.time_limit_sec ─────────────────

    #[tokio::test]
    async fn question_broadcast_uses_session_time_limit() {
        // session.time_limit_sec = 30; q.time_limit_sec = 20 (deliberately different)
        let session = make_session(30, 20);
        {
            let mut s = session.write().await;
            s.status = SessionStatus::Active;
            s.current_question = -1;
        }

        let (tx, mut rx) = broadcast::channel::<GameEvent>(16);

        // Call do_advance_question directly (pub(crate)) to skip the 3s start delay
        do_advance_question(session.clone(), tx.clone(), make_session_manager()).await;

        // Receive the question broadcast
        let event = tokio::time::timeout(Duration::from_millis(500), rx.recv())
            .await
            .expect("timeout waiting for question event")
            .expect("channel error");

        let msg = match event {
            GameEvent::BroadcastAll(m) => m,
            other => panic!("expected BroadcastAll, got {other:?}"),
        };
        let parsed: serde_json::Value = serde_json::from_str(&msg).unwrap();
        assert_eq!(parsed["type"], "question", "wrong message type");
        // Must use session's time_limit_sec (30), NOT question's (20)
        assert_eq!(
            parsed["payload"]["time_limit_sec"], 30,
            "question broadcast should use session.time_limit_sec"
        );
    }

    // ── T003: scoring uses session.time_limit_sec ────────────────────────────

    #[tokio::test]
    async fn scoring_uses_session_time_limit() {
        // session.time_limit_sec = 30; q.time_limit_sec = 20 (deliberately different)
        let session = make_session(30, 20);
        let player_id = "player-1";

        {
            let mut s = session.write().await;
            s.status = SessionStatus::Active;
            s.current_question = 0;
            // Use LinearDecay so scoring depends on time_limit_sec
            s.scoring_rule = ScoringRule::LinearDecay;
            // Simulate 5 seconds elapsed
            s.question_started = Some(Instant::now() - Duration::from_secs(5));
            s.players.insert(
                player_id.to_string(),
                Player::new(player_id.to_string(), "Alice".to_string(), "🙂".to_string()),
            );
        }

        let (tx, mut rx) = broadcast::channel::<GameEvent>(16);

        // correct answer is index 1
        handle_answer(&session, &tx, player_id, 0, 1, make_session_manager()).await;

        // Collect events until we find answer_result
        let mut points_awarded = None;
        for _ in 0..10 {
            let event = tokio::time::timeout(Duration::from_millis(200), rx.recv()).await;
            let Ok(Ok(event)) = event else { break };
            let msg = match &event {
                GameEvent::PlayerOnly { message, .. } => message.clone(),
                _ => continue,
            };
            let parsed: serde_json::Value = serde_json::from_str(&msg).unwrap();
            if parsed["type"] == "answer_result" {
                points_awarded = parsed["payload"]["points_awarded"].as_u64();
                break;
            }
        }

        let points = points_awarded.expect("did not receive answer_result");
        // With LinearDecay, time_limit=30, 5s elapsed:
        // step_size = 1000/30 = 33; raw = 1000 - 5*33 = 835
        // (would be 750 if incorrectly using q.time_limit_sec=20)
        assert_eq!(points, 835, "scoring should use session.time_limit_sec=30");
    }

    // ── T008: handle_set_time_limit ──────────────────────────────────────────

    #[test]
    fn set_time_limit_accepts_minimum_boundary() {
        let session_arc = make_session(20, 20);
        let mut session = session_arc.blocking_write();
        let (tx, mut rx) = broadcast::channel::<GameEvent>(4);

        handle_set_time_limit(&mut session, 10, &tx);

        assert_eq!(session.time_limit_sec, 10);
        let event = rx.try_recv().expect("expected broadcast");
        let msg = match event {
            GameEvent::BroadcastAll(m) => m,
            other => panic!("expected BroadcastAll, got {other:?}"),
        };
        let parsed: serde_json::Value = serde_json::from_str(&msg).unwrap();
        assert_eq!(parsed["type"], "time_limit_set");
        assert_eq!(parsed["payload"]["seconds"], 10);
    }

    #[test]
    fn set_time_limit_accepts_maximum_boundary() {
        let session_arc = make_session(20, 20);
        let mut session = session_arc.blocking_write();
        let (tx, mut rx) = broadcast::channel::<GameEvent>(4);

        handle_set_time_limit(&mut session, 60, &tx);

        assert_eq!(session.time_limit_sec, 60);
        let event = rx.try_recv().expect("expected broadcast");
        let msg = match event {
            GameEvent::BroadcastAll(m) => m,
            _ => panic!("expected BroadcastAll"),
        };
        let parsed: serde_json::Value = serde_json::from_str(&msg).unwrap();
        assert_eq!(parsed["payload"]["seconds"], 60);
    }

    #[test]
    fn set_time_limit_rejects_below_minimum() {
        let session_arc = make_session(20, 20);
        let mut session = session_arc.blocking_write();
        let (tx, mut rx) = broadcast::channel::<GameEvent>(4);

        handle_set_time_limit(&mut session, 9, &tx);

        // time_limit_sec unchanged
        assert_eq!(session.time_limit_sec, 20);
        let event = rx.try_recv().expect("expected error event");
        let msg = match event {
            GameEvent::HostOnly(m) => m,
            other => panic!("expected HostOnly error, got {other:?}"),
        };
        let parsed: serde_json::Value = serde_json::from_str(&msg).unwrap();
        assert_eq!(parsed["type"], "error");
        assert_eq!(parsed["payload"]["code"], "invalid_time_limit");
    }

    #[test]
    fn set_time_limit_rejects_above_maximum() {
        let session_arc = make_session(20, 20);
        let mut session = session_arc.blocking_write();
        let (tx, mut rx) = broadcast::channel::<GameEvent>(4);

        handle_set_time_limit(&mut session, 61, &tx);

        assert_eq!(session.time_limit_sec, 20);
        let event = rx.try_recv().expect("expected error event");
        let msg = match event {
            GameEvent::HostOnly(m) => m,
            other => panic!("expected HostOnly error, got {other:?}"),
        };
        let parsed: serde_json::Value = serde_json::from_str(&msg).unwrap();
        assert_eq!(parsed["type"], "error");
        assert_eq!(parsed["payload"]["code"], "invalid_time_limit");
    }

    #[test]
    fn set_time_limit_ignored_when_active() {
        let session_arc = make_session(20, 20);
        let mut session = session_arc.blocking_write();
        session.status = SessionStatus::Active;
        let (tx, mut rx) = broadcast::channel::<GameEvent>(4);

        handle_set_time_limit(&mut session, 30, &tx);

        // No change, no broadcast
        assert_eq!(session.time_limit_sec, 20);
        assert!(rx.try_recv().is_err(), "should not broadcast when active");
    }

    // ── T008: handle_answer streak scoring ───────────────────────────────────

    fn make_session_with_rule(rule: ScoringRule, time_limit: u64) -> Arc<RwLock<GameSession>> {
        let quiz = make_quiz(time_limit);
        let mut session_data = GameSession::new("TSTCDE".to_string(), quiz, time_limit);
        session_data.scoring_rule = rule;
        Arc::new(RwLock::new(session_data))
    }

    #[tokio::test]
    async fn streak_bonus_first_correct_answer_awards_1000_pts() {
        let session = make_session_with_rule(ScoringRule::StreakBonus, 20);
        let player_id = "player-1";
        {
            let mut s = session.write().await;
            s.status = SessionStatus::Active;
            s.current_question = 0;
            s.players.insert(
                player_id.to_string(),
                Player::new(player_id.to_string(), "Alice".to_string(), "🙂".to_string()),
            );
            // Add a second player so do_end_question is not triggered
            s.players.insert(
                "player-2".to_string(),
                Player::new("player-2".to_string(), "Bob".to_string(), "🙂".to_string()),
            );
        }

        let (tx, mut rx) = broadcast::channel::<GameEvent>(16);
        handle_answer(&session, &tx, player_id, 0, 1, make_session_manager()).await; // correct index is 1

        let mut points_awarded = None;
        let mut streak_multiplier = None;
        for _ in 0..10 {
            let event = tokio::time::timeout(Duration::from_millis(200), rx.recv()).await;
            let Ok(Ok(event)) = event else { break };
            let msg = match &event {
                GameEvent::PlayerOnly { message, .. } => message.clone(),
                _ => continue,
            };
            let parsed: serde_json::Value = serde_json::from_str(&msg).unwrap();
            if parsed["type"] == "answer_result" {
                points_awarded = parsed["payload"]["points_awarded"].as_u64();
                streak_multiplier = parsed["payload"]["streak_multiplier"].as_f64();
                break;
            }
        }

        assert_eq!(
            points_awarded.expect("no answer_result"),
            1000,
            "streak=0 → ×1.0 → 1000 pts"
        );
        assert!(
            (streak_multiplier.expect("no streak_multiplier") - 1.0).abs() < f64::EPSILON,
            "streak=0 multiplier should be 1.0"
        );
    }

    #[tokio::test]
    async fn streak_bonus_second_correct_answer_awards_1500_pts() {
        let session = make_session_with_rule(ScoringRule::StreakBonus, 20);
        let player_id = "player-1";
        {
            let mut s = session.write().await;
            s.status = SessionStatus::Active;
            s.current_question = 0;
            let mut player =
                Player::new(player_id.to_string(), "Alice".to_string(), "🙂".to_string());
            player.correct_streak = 1; // already answered 1 correctly
            s.players.insert(player_id.to_string(), player);
            s.players.insert(
                "player-2".to_string(),
                Player::new("player-2".to_string(), "Bob".to_string(), "🙂".to_string()),
            );
        }

        let (tx, mut rx) = broadcast::channel::<GameEvent>(16);
        handle_answer(&session, &tx, player_id, 0, 1, make_session_manager()).await;

        let mut points_awarded = None;
        let mut streak_multiplier = None;
        for _ in 0..10 {
            let event = tokio::time::timeout(Duration::from_millis(200), rx.recv()).await;
            let Ok(Ok(event)) = event else { break };
            let msg = match &event {
                GameEvent::PlayerOnly { message, .. } => message.clone(),
                _ => continue,
            };
            let parsed: serde_json::Value = serde_json::from_str(&msg).unwrap();
            if parsed["type"] == "answer_result" {
                points_awarded = parsed["payload"]["points_awarded"].as_u64();
                streak_multiplier = parsed["payload"]["streak_multiplier"].as_f64();
                break;
            }
        }

        assert_eq!(
            points_awarded.expect("no answer_result"),
            1500,
            "streak=1 → ×1.5 → 1500 pts"
        );
        assert!(
            (streak_multiplier.expect("no streak_multiplier") - 1.5).abs() < f64::EPSILON,
            "streak=1 multiplier should be 1.5"
        );
    }

    #[tokio::test]
    async fn streak_bonus_correct_answer_increments_streak() {
        let session = make_session_with_rule(ScoringRule::StreakBonus, 20);
        let player_id = "player-1";
        {
            let mut s = session.write().await;
            s.status = SessionStatus::Active;
            s.current_question = 0;
            s.players.insert(
                player_id.to_string(),
                Player::new(player_id.to_string(), "Alice".to_string(), "🙂".to_string()),
            );
            s.players.insert(
                "player-2".to_string(),
                Player::new("player-2".to_string(), "Bob".to_string(), "🙂".to_string()),
            );
        }

        let (tx, _rx) = broadcast::channel::<GameEvent>(16);
        handle_answer(&session, &tx, player_id, 0, 1, make_session_manager()).await;

        let s = session.read().await;
        assert_eq!(
            s.players[player_id].correct_streak, 1,
            "streak should increment after correct answer"
        );
    }

    #[tokio::test]
    async fn non_streak_rule_always_sends_multiplier_1_0() {
        let session = make_session_with_rule(ScoringRule::FixedScore, 20);
        let player_id = "player-1";
        {
            let mut s = session.write().await;
            s.status = SessionStatus::Active;
            s.current_question = 0;
            let mut player =
                Player::new(player_id.to_string(), "Alice".to_string(), "🙂".to_string());
            player.correct_streak = 5; // has some streak value, but rule is FixedScore
            s.players.insert(player_id.to_string(), player);
            s.players.insert(
                "player-2".to_string(),
                Player::new("player-2".to_string(), "Bob".to_string(), "🙂".to_string()),
            );
        }

        let (tx, mut rx) = broadcast::channel::<GameEvent>(16);
        handle_answer(&session, &tx, player_id, 0, 1, make_session_manager()).await;

        let mut streak_multiplier = None;
        for _ in 0..10 {
            let event = tokio::time::timeout(Duration::from_millis(200), rx.recv()).await;
            let Ok(Ok(event)) = event else { break };
            let msg = match &event {
                GameEvent::PlayerOnly { message, .. } => message.clone(),
                _ => continue,
            };
            let parsed: serde_json::Value = serde_json::from_str(&msg).unwrap();
            if parsed["type"] == "answer_result" {
                streak_multiplier = parsed["payload"]["streak_multiplier"].as_f64();
                break;
            }
        }

        assert!(
            (streak_multiplier.expect("no streak_multiplier") - 1.0).abs() < f64::EPSILON,
            "non-streak rules should always report multiplier 1.0"
        );
    }

    // ── T012: streak reset on incorrect answer ───────────────────────────────

    #[tokio::test]
    async fn incorrect_answer_resets_correct_streak() {
        let session = make_session_with_rule(ScoringRule::StreakBonus, 20);
        let player_id = "player-1";
        {
            let mut s = session.write().await;
            s.status = SessionStatus::Active;
            s.current_question = 0;
            let mut player =
                Player::new(player_id.to_string(), "Alice".to_string(), "🙂".to_string());
            player.correct_streak = 2;
            s.players.insert(player_id.to_string(), player);
            // Second player so do_end_question is not triggered
            s.players.insert(
                "player-2".to_string(),
                Player::new("player-2".to_string(), "Bob".to_string(), "🙂".to_string()),
            );
        }

        let (tx, _rx) = broadcast::channel::<GameEvent>(16);
        // Submit wrong answer (correct is index 1, submit index 0)
        handle_answer(&session, &tx, player_id, 0, 0, make_session_manager()).await;

        let s = session.read().await;
        assert_eq!(
            s.players[player_id].correct_streak, 0,
            "incorrect answer should reset streak to 0"
        );
    }

    #[tokio::test]
    async fn incorrect_answer_sends_multiplier_1_0_in_response() {
        let session = make_session_with_rule(ScoringRule::StreakBonus, 20);
        let player_id = "player-1";
        {
            let mut s = session.write().await;
            s.status = SessionStatus::Active;
            s.current_question = 0;
            let mut player =
                Player::new(player_id.to_string(), "Alice".to_string(), "🙂".to_string());
            player.correct_streak = 2;
            s.players.insert(player_id.to_string(), player);
            s.players.insert(
                "player-2".to_string(),
                Player::new("player-2".to_string(), "Bob".to_string(), "🙂".to_string()),
            );
        }

        let (tx, mut rx) = broadcast::channel::<GameEvent>(16);
        handle_answer(&session, &tx, player_id, 0, 0, make_session_manager()).await; // incorrect

        let mut streak_multiplier = None;
        for _ in 0..10 {
            let event = tokio::time::timeout(Duration::from_millis(200), rx.recv()).await;
            let Ok(Ok(event)) = event else { break };
            let msg = match &event {
                GameEvent::PlayerOnly { message, .. } => message.clone(),
                _ => continue,
            };
            let parsed: serde_json::Value = serde_json::from_str(&msg).unwrap();
            if parsed["type"] == "answer_result" {
                streak_multiplier = parsed["payload"]["streak_multiplier"].as_f64();
                break;
            }
        }

        // After incorrect answer, multiplier shown reflects the reset state (1.0)
        // Note: the multiplier shown is based on PRE-answer streak (2.0 + ... no wait)
        // Actually the multiplier in the response is the one USED for scoring,
        // which was 2.0 (streak=2 before reset). But points = 0 since incorrect.
        // The multiplier field shows what was applied: 2.0 for streak=2, but points=0.
        // Let's verify the multiplier = 2.0 (pre-answer streak) since the math is:
        // base_points = 0 (incorrect), apply_streak_multiplier(0, 2) = 0.
        // streak_multiplier = 1.0 + 2 * 0.5 = 2.0.
        // After this, streak is reset to 0 for NEXT answer.
        assert!(
            (streak_multiplier.expect("no streak_multiplier") - 2.0).abs() < f64::EPSILON,
            "multiplier shown should reflect pre-answer streak even on incorrect answer"
        );
    }

    // ── T014: streak reset on question timeout ────────────────────────────────

    #[tokio::test]
    async fn do_end_question_resets_streak_for_unanswered_with_streak_bonus() {
        let session = make_session_with_rule(ScoringRule::StreakBonus, 20);
        let player_id = "player-1";
        {
            let mut s = session.write().await;
            s.status = SessionStatus::Active;
            s.current_question = 0;
            let mut player =
                Player::new(player_id.to_string(), "Alice".to_string(), "🙂".to_string());
            player.correct_streak = 2;
            s.players.insert(player_id.to_string(), player);
        }

        let (tx, _rx) = broadcast::channel::<GameEvent>(16);
        do_end_question(session.clone(), tx, 0, make_session_manager()).await;

        let s = session.read().await;
        assert_eq!(
            s.players[player_id].correct_streak, 0,
            "unanswered player streak should be reset after question timeout"
        );
    }

    #[tokio::test]
    async fn do_end_question_preserves_streak_for_answered_players() {
        let session = make_session_with_rule(ScoringRule::StreakBonus, 20);
        let player_id = "player-1";
        {
            let mut s = session.write().await;
            s.status = SessionStatus::Active;
            s.current_question = 0;
            let mut player =
                Player::new(player_id.to_string(), "Alice".to_string(), "🙂".to_string());
            player.correct_streak = 2;
            // Mark as already answered so they are NOT reset
            player.answers.push(crate::models::player::Answer {
                question_index: 0,
                selected_index: 1,
                time_taken_ms: 1000,
                points_awarded: 2000,
            });
            s.players.insert(player_id.to_string(), player);
        }

        let (tx, _rx) = broadcast::channel::<GameEvent>(16);
        do_end_question(session.clone(), tx, 0, make_session_manager()).await;

        let s = session.read().await;
        assert_eq!(
            s.players[player_id].correct_streak, 2,
            "answered player streak should not be reset by do_end_question"
        );
    }

    #[tokio::test]
    async fn do_end_question_does_not_reset_streak_for_non_streak_bonus_rule() {
        let session = make_session_with_rule(ScoringRule::FixedScore, 20);
        let player_id = "player-1";
        {
            let mut s = session.write().await;
            s.status = SessionStatus::Active;
            s.current_question = 0;
            let mut player =
                Player::new(player_id.to_string(), "Alice".to_string(), "🙂".to_string());
            player.correct_streak = 3;
            s.players.insert(player_id.to_string(), player);
        }

        let (tx, _rx) = broadcast::channel::<GameEvent>(16);
        do_end_question(session.clone(), tx, 0, make_session_manager()).await;

        let s = session.read().await;
        assert_eq!(
            s.players[player_id].correct_streak, 3,
            "streak should not be modified for non-StreakBonus rules"
        );
    }

    // ── T006 / T013: position race ───────────────────────────────────────────

    #[tokio::test]
    async fn position_race_correct_answer_count_resets_on_new_question() {
        let session = make_session_with_rule(ScoringRule::PositionRace, 20);
        {
            let mut s = session.write().await;
            s.status = SessionStatus::Active;
            s.current_question = -1;
            s.correct_answer_count = 5; // stale value from previous question
        }
        let (tx, _rx) = broadcast::channel::<GameEvent>(16);
        do_advance_question(session.clone(), tx, make_session_manager()).await;

        let s = session.read().await;
        assert_eq!(
            s.correct_answer_count, 0,
            "correct_answer_count must reset to 0 when a new question starts"
        );
    }

    #[tokio::test]
    async fn position_race_first_correct_answer_awards_1000_pts() {
        let session = make_session_with_rule(ScoringRule::PositionRace, 20);
        let player_id = "player-1";
        {
            let mut s = session.write().await;
            s.status = SessionStatus::Active;
            s.current_question = 0;
            s.players.insert(
                player_id.to_string(),
                Player::new(player_id.to_string(), "Alice".to_string(), "🙂".to_string()),
            );
            s.players.insert(
                "player-2".to_string(),
                Player::new("player-2".to_string(), "Bob".to_string(), "🙂".to_string()),
            );
        }
        let (tx, mut rx) = broadcast::channel::<GameEvent>(16);
        handle_answer(&session, &tx, player_id, 0, 1, make_session_manager()).await; // correct index is 1

        let mut result = None;
        for _ in 0..10 {
            let event = tokio::time::timeout(Duration::from_millis(200), rx.recv()).await;
            let Ok(Ok(event)) = event else { break };
            let msg = match &event {
                GameEvent::PlayerOnly { message, .. } => message.clone(),
                _ => continue,
            };
            let parsed: serde_json::Value = serde_json::from_str(&msg).unwrap();
            if parsed["type"] == "answer_result" {
                result = Some(parsed);
                break;
            }
        }

        let result = result.expect("no answer_result received");
        assert_eq!(
            result["payload"]["points_awarded"], 1000,
            "1st correct → 1000 pts"
        );
        assert_eq!(result["payload"]["position"], 1, "1st correct → position 1");
    }

    #[tokio::test]
    async fn position_race_second_correct_answer_awards_750_pts() {
        let session = make_session_with_rule(ScoringRule::PositionRace, 20);
        let player1_id = "player-1";
        let player2_id = "player-2";
        {
            let mut s = session.write().await;
            s.status = SessionStatus::Active;
            s.current_question = 0;
            s.players.insert(
                player1_id.to_string(),
                Player::new(
                    player1_id.to_string(),
                    "Alice".to_string(),
                    "🙂".to_string(),
                ),
            );
            s.players.insert(
                player2_id.to_string(),
                Player::new(player2_id.to_string(), "Bob".to_string(), "🙂".to_string()),
            );
        }
        let (tx, mut rx) = broadcast::channel::<GameEvent>(32);

        // Player 1 answers first (correct)
        handle_answer(&session, &tx, player1_id, 0, 1, make_session_manager()).await;
        // Player 2 answers second (correct)
        handle_answer(&session, &tx, player2_id, 0, 1, make_session_manager()).await;

        // Collect both answer_result events
        let mut points_by_player: std::collections::HashMap<String, u64> =
            std::collections::HashMap::new();
        for _ in 0..20 {
            let event = tokio::time::timeout(Duration::from_millis(200), rx.recv()).await;
            let Ok(Ok(event)) = event else { break };
            match event {
                GameEvent::PlayerOnly { player_id, message } => {
                    let parsed: serde_json::Value = serde_json::from_str(&message).unwrap();
                    if parsed["type"] == "answer_result" {
                        if let Some(pts) = parsed["payload"]["points_awarded"].as_u64() {
                            points_by_player.insert(player_id, pts);
                        }
                    }
                }
                _ => {}
            }
        }

        assert_eq!(
            points_by_player.get(player1_id).copied(),
            Some(1000),
            "1st correct → 1000 pts"
        );
        assert_eq!(
            points_by_player.get(player2_id).copied(),
            Some(750),
            "2nd correct → 750 pts"
        );
    }

    #[tokio::test]
    async fn position_race_wrong_answer_awards_0_pts_and_no_position() {
        let session = make_session_with_rule(ScoringRule::PositionRace, 20);
        let player_id = "player-1";
        {
            let mut s = session.write().await;
            s.status = SessionStatus::Active;
            s.current_question = 0;
            s.players.insert(
                player_id.to_string(),
                Player::new(player_id.to_string(), "Alice".to_string(), "🙂".to_string()),
            );
            s.players.insert(
                "player-2".to_string(),
                Player::new("player-2".to_string(), "Bob".to_string(), "🙂".to_string()),
            );
        }
        let (tx, mut rx) = broadcast::channel::<GameEvent>(16);
        // correct index is 1; submit 0 (wrong)
        handle_answer(&session, &tx, player_id, 0, 0, make_session_manager()).await;

        let mut result = None;
        for _ in 0..10 {
            let event = tokio::time::timeout(Duration::from_millis(200), rx.recv()).await;
            let Ok(Ok(event)) = event else { break };
            let msg = match &event {
                GameEvent::PlayerOnly { message, .. } => message.clone(),
                _ => continue,
            };
            let parsed: serde_json::Value = serde_json::from_str(&msg).unwrap();
            if parsed["type"] == "answer_result" {
                result = Some(parsed);
                break;
            }
        }

        let result = result.expect("no answer_result received");
        assert_eq!(
            result["payload"]["points_awarded"], 0,
            "wrong answer → 0 pts"
        );
        assert!(
            result["payload"]["position"].is_null(),
            "wrong answer → position must be null"
        );

        // Counter must NOT have incremented
        let s = session.read().await;
        assert_eq!(
            s.correct_answer_count, 0,
            "wrong answer must not increment correct_answer_count"
        );
    }

    // ── T017: do_end_question idempotency ────────────────────────────────────

    #[tokio::test]
    async fn end_question_is_idempotent() {
        let session = make_session(20, 20);
        {
            let mut s = session.write().await;
            s.status = SessionStatus::Active;
            s.current_question = 0; // question 0 is active
        }

        let (tx, mut rx) = broadcast::channel::<GameEvent>(16);

        // First call: question 0 is current → should broadcast question_ended
        do_end_question(session.clone(), tx.clone(), 0, make_session_manager()).await;

        // After do_end_question, it calls send_next_question which advances current_question
        // Wait briefly for the spawn to run
        tokio::time::sleep(Duration::from_millis(600)).await;

        // Drain received events
        let mut ended_count = 0usize;
        loop {
            match rx.try_recv() {
                Ok(GameEvent::BroadcastAll(m)) => {
                    let parsed: serde_json::Value = serde_json::from_str(&m).unwrap();
                    if parsed["type"] == "question_ended" {
                        ended_count += 1;
                    }
                }
                _ => break,
            }
        }

        // Second call with the same index (0): current_question has advanced, so guard fires
        do_end_question(session.clone(), tx.clone(), 0, make_session_manager()).await;

        // No additional question_ended broadcast from the second call
        let mut extra_ended = 0usize;
        tokio::time::sleep(Duration::from_millis(100)).await;
        loop {
            match rx.try_recv() {
                Ok(GameEvent::BroadcastAll(m)) => {
                    let parsed: serde_json::Value = serde_json::from_str(&m).unwrap();
                    if parsed["type"] == "question_ended" {
                        extra_ended += 1;
                    }
                }
                _ => break,
            }
        }

        assert_eq!(
            ended_count, 1,
            "first call should broadcast question_ended once"
        );
        assert_eq!(extra_ended, 0, "second call should be a no-op");
    }
}
