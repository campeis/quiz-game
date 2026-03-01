use std::collections::HashMap;
use std::time::Instant;

use serde::{Deserialize, Serialize};

use super::player::Player;
use super::quiz::Quiz;
use super::scoring_rule::ScoringRule;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SessionStatus {
    Lobby,
    Active,
    Paused,
    Finished,
}

#[derive(Debug)]
pub struct GameSession {
    pub join_code: String,
    pub quiz: Quiz,
    pub players: HashMap<String, Player>,
    pub host_id: Option<String>,
    pub current_question: i32,
    pub status: SessionStatus,
    pub question_started: Option<Instant>,
    pub created_at: Instant,
    pub scoring_rule: ScoringRule,
}

impl GameSession {
    pub fn new(join_code: String, quiz: Quiz) -> Self {
        Self {
            join_code,
            quiz,
            players: HashMap::new(),
            host_id: None,
            current_question: -1,
            status: SessionStatus::Lobby,
            question_started: None,
            created_at: Instant::now(),
            scoring_rule: ScoringRule::default(),
        }
    }

    pub fn player_count(&self) -> usize {
        self.players
            .values()
            .filter(|p| p.connection_status == super::player::ConnectionStatus::Connected)
            .count()
    }

    pub fn total_player_count(&self) -> usize {
        self.players.len()
    }

    pub fn is_joinable(&self) -> bool {
        self.status == SessionStatus::Lobby
    }

    pub fn total_questions(&self) -> usize {
        self.quiz.questions.len()
    }
}
