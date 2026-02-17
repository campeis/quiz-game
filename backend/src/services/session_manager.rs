use std::sync::Arc;

use dashmap::DashMap;
use tokio::sync::RwLock;

use crate::config::AppConfig;
use crate::errors::AppError;
use crate::models::quiz::Quiz;
use crate::models::session::GameSession;

pub type SharedSession = Arc<RwLock<GameSession>>;

#[derive(Debug, Clone)]
pub struct SessionManager {
    sessions: Arc<DashMap<String, SharedSession>>,
    quizzes: Arc<DashMap<String, Quiz>>,
    config: AppConfig,
}

impl SessionManager {
    pub fn new(config: AppConfig) -> Self {
        Self {
            sessions: Arc::new(DashMap::new()),
            quizzes: Arc::new(DashMap::new()),
            config,
        }
    }

    pub fn store_quiz(&self, quiz_id: String, quiz: Quiz) {
        self.quizzes.insert(quiz_id, quiz);
    }

    pub fn get_quiz(&self, quiz_id: &str) -> Option<Quiz> {
        self.quizzes.get(quiz_id).map(|q| q.clone())
    }

    pub fn create_session(&self, quiz: Quiz) -> Result<SharedSession, AppError> {
        if self.sessions.len() >= self.config.max_sessions {
            return Err(AppError::MaxSessionsReached);
        }

        let join_code = self.generate_join_code();
        let session = GameSession::new(join_code.clone(), quiz);
        let shared = Arc::new(RwLock::new(session));
        self.sessions.insert(join_code, shared.clone());
        Ok(shared)
    }

    pub fn get_session(&self, join_code: &str) -> Option<SharedSession> {
        self.sessions.get(join_code).map(|s| s.clone())
    }

    pub fn remove_session(&self, join_code: &str) {
        self.sessions.remove(join_code);
    }

    pub fn max_players(&self) -> usize {
        self.config.max_players
    }

    pub fn question_time_sec(&self) -> u64 {
        self.config.question_time_sec
    }

    pub fn reconnect_timeout_sec(&self) -> u64 {
        self.config.reconnect_timeout_sec
    }

    fn generate_join_code(&self) -> String {
        use uuid::Uuid;
        loop {
            let code: String = Uuid::new_v4()
                .to_string()
                .chars()
                .filter(|c| c.is_alphanumeric())
                .take(6)
                .collect::<String>()
                .to_uppercase();
            if code.len() == 6 && !self.sessions.contains_key(&code) {
                return code;
            }
        }
    }
}
