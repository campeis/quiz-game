use quiz_server::config::AppConfig;
use quiz_server::models::quiz::{Question, Quiz, QuizOption};
use quiz_server::services::session_manager::SessionManager;

fn test_config(max_sessions: usize) -> AppConfig {
    AppConfig {
        port: 3000,
        max_sessions,
        max_players: 50,
        question_time_sec: 20,
        reconnect_timeout_sec: 120,
        static_dir: None,
    }
}

fn sample_quiz() -> Quiz {
    Quiz {
        title: "Test Quiz".into(),
        questions: vec![Question {
            text: "What is 1+1?".into(),
            options: vec![
                QuizOption { text: "1".into() },
                QuizOption { text: "2".into() },
                QuizOption { text: "3".into() },
            ],
            correct_index: 1,
            time_limit_sec: 20,
        }],
    }
}

#[tokio::test]
async fn create_session_returns_session() {
    let mgr = SessionManager::new(test_config(10));
    let session = mgr.create_session(sample_quiz()).unwrap();

    let session = session.read().await;
    assert_eq!(session.quiz.title, "Test Quiz");
    assert_eq!(session.join_code.len(), 6);
    assert!(session.is_joinable());
}

#[tokio::test]
async fn get_session_by_join_code() {
    let mgr = SessionManager::new(test_config(10));
    let session = mgr.create_session(sample_quiz()).unwrap();
    let code = session.read().await.join_code.clone();

    let found = mgr.get_session(&code);
    assert!(found.is_some());
}

#[test]
fn get_nonexistent_session_returns_none() {
    let mgr = SessionManager::new(test_config(10));
    assert!(mgr.get_session("ABCDEF").is_none());
}

#[tokio::test]
async fn remove_session_works() {
    let mgr = SessionManager::new(test_config(10));
    let session = mgr.create_session(sample_quiz()).unwrap();
    let code = session.read().await.join_code.clone();

    mgr.remove_session(&code);
    assert!(mgr.get_session(&code).is_none());
}

#[test]
fn max_sessions_enforcement() {
    let mgr = SessionManager::new(test_config(2));

    mgr.create_session(sample_quiz()).unwrap();
    mgr.create_session(sample_quiz()).unwrap();

    let result = mgr.create_session(sample_quiz());
    assert!(result.is_err());
}

#[tokio::test]
async fn join_codes_are_unique() {
    let mgr = SessionManager::new(test_config(100));
    let mut codes = std::collections::HashSet::new();

    for _ in 0..20 {
        let session = mgr.create_session(sample_quiz()).unwrap();
        let code = session.read().await.join_code.clone();
        assert!(codes.insert(code), "duplicate join code generated");
    }
}

#[tokio::test]
async fn join_code_is_6_uppercase_alphanumeric() {
    let mgr = SessionManager::new(test_config(10));
    let session = mgr.create_session(sample_quiz()).unwrap();
    let code = session.read().await.join_code.clone();

    assert_eq!(code.len(), 6);
    assert!(code.chars().all(|c| c.is_ascii_alphanumeric() && c.is_uppercase() || c.is_ascii_digit()));
}

#[test]
fn store_and_get_quiz() {
    let mgr = SessionManager::new(test_config(10));
    let quiz = sample_quiz();

    mgr.store_quiz("q1".into(), quiz.clone());
    let found = mgr.get_quiz("q1");
    assert!(found.is_some());
    assert_eq!(found.unwrap().title, "Test Quiz");
}

#[test]
fn get_nonexistent_quiz_returns_none() {
    let mgr = SessionManager::new(test_config(10));
    assert!(mgr.get_quiz("nope").is_none());
}
