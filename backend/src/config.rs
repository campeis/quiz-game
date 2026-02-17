use std::env;

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub port: u16,
    pub max_sessions: usize,
    pub max_players: usize,
    pub question_time_sec: u64,
    pub reconnect_timeout_sec: u64,
    pub static_dir: Option<String>,
}

impl AppConfig {
    pub fn from_env() -> Self {
        Self {
            port: env_var_or("PORT", 3000),
            max_sessions: env_var_or("MAX_SESSIONS", 10),
            max_players: env_var_or("MAX_PLAYERS", 50),
            question_time_sec: env_var_or("QUESTION_TIME_SEC", 20),
            reconnect_timeout_sec: env_var_or("RECONNECT_TIMEOUT", 120),
            static_dir: env::var("STATIC_DIR").ok(),
        }
    }
}

fn env_var_or<T: std::str::FromStr>(key: &str, default: T) -> T {
    env::var(key)
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(default)
}
