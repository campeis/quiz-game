use std::time::Instant;

use serde::{Deserialize, Serialize};

pub const DEFAULT_AVATAR: &str = "🙂";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ConnectionStatus {
    Connected,
    Disconnected,
    Left,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Answer {
    pub question_index: usize,
    pub selected_index: usize,
    pub time_taken_ms: u64,
    pub points_awarded: u32,
}

#[derive(Debug)]
pub struct Player {
    pub id: String,
    pub display_name: String,
    pub avatar: String,
    pub score: u32,
    pub correct_count: u32,
    pub answers: Vec<Answer>,
    pub connection_status: ConnectionStatus,
    pub disconnected_at: Option<Instant>,
}

impl Player {
    pub fn new(id: String, display_name: String, avatar: String) -> Self {
        Self {
            id,
            display_name,
            avatar,
            score: 0,
            correct_count: 0,
            answers: Vec::new(),
            connection_status: ConnectionStatus::Connected,
            disconnected_at: None,
        }
    }

    pub fn has_answered(&self, question_index: usize) -> bool {
        self.answers
            .iter()
            .any(|a| a.question_index == question_index)
    }
}
