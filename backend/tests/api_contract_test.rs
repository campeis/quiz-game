use axum::body::Body;
use axum::http::{Request, StatusCode};
use axum::Router;
use http_body_util::BodyExt;
use tower::ServiceExt;

use quiz_server::config::AppConfig;
use quiz_server::services::session_manager::SessionManager;

fn test_config() -> AppConfig {
    AppConfig {
        port: 3000,
        max_sessions: 10,
        max_players: 50,
        question_time_sec: 20,
        reconnect_timeout_sec: 120,
        static_dir: None,
    }
}

fn test_app() -> Router {
    let config = test_config();
    let session_manager = SessionManager::new(config.clone());
    quiz_server::build_router(session_manager, config)
}

// === POST /api/quiz ===

#[tokio::test]
async fn upload_valid_quiz_returns_200_with_preview() {
    let app = test_app();

    let quiz_content = "# Test Quiz\n? Q1\n- Wrong\n* Right\n- Also wrong\n? Q2\n* Correct\n- Nope\n";
    let boundary = "----TestBoundary";
    let body = format!(
        "--{boundary}\r\nContent-Disposition: form-data; name=\"quiz_file\"; filename=\"quiz.txt\"\r\nContent-Type: text/plain\r\n\r\n{quiz_content}\r\n--{boundary}--\r\n"
    );

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/quiz")
                .header("Content-Type", format!("multipart/form-data; boundary={boundary}"))
                .body(Body::from(body))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: serde_json::Value = serde_json::from_slice(&body).unwrap();

    assert_eq!(json["title"], "Test Quiz");
    assert_eq!(json["question_count"], 2);
    assert!(json["quiz_id"].is_string());
    assert!(json["preview"].is_array());
    assert_eq!(json["preview"].as_array().unwrap().len(), 2);
}

#[tokio::test]
async fn upload_invalid_quiz_returns_400() {
    let app = test_app();

    let quiz_content = "# Bad Quiz\n? No correct answer\n- A\n- B\n";
    let boundary = "----TestBoundary";
    let body = format!(
        "--{boundary}\r\nContent-Disposition: form-data; name=\"quiz_file\"; filename=\"quiz.txt\"\r\nContent-Type: text/plain\r\n\r\n{quiz_content}\r\n--{boundary}--\r\n"
    );

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/quiz")
                .header("Content-Type", format!("multipart/form-data; boundary={boundary}"))
                .body(Body::from(body))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(json["error"], "invalid_quiz_file");
}

// === POST /api/sessions ===

#[tokio::test]
async fn create_session_returns_201_with_join_code() {
    let app = test_app();

    // First upload a quiz
    let quiz_content = "# Session Test\n? Q1\n- A\n* B\n";
    let boundary = "----TestBoundary";
    let body = format!(
        "--{boundary}\r\nContent-Disposition: form-data; name=\"quiz_file\"; filename=\"quiz.txt\"\r\nContent-Type: text/plain\r\n\r\n{quiz_content}\r\n--{boundary}--\r\n"
    );

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/quiz")
                .header("Content-Type", format!("multipart/form-data; boundary={boundary}"))
                .body(Body::from(body))
                .unwrap(),
        )
        .await
        .unwrap();

    let body_bytes = response.into_body().collect().await.unwrap().to_bytes();
    let upload_json: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
    let quiz_id = upload_json["quiz_id"].as_str().unwrap();

    // Now create a session
    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/sessions")
                .header("Content-Type", "application/json")
                .body(Body::from(format!(r#"{{"quiz_id":"{}"}}"#, quiz_id)))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::CREATED);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert!(json["join_code"].is_string());
    assert_eq!(json["join_code"].as_str().unwrap().len(), 6);
    assert_eq!(json["session_status"], "lobby");
    assert!(json["ws_url"].as_str().unwrap().starts_with("/ws/host/"));
}

// Helper: upload quiz + create session, return (app, join_code)
async fn setup_session(app: &Router) -> String {
    let quiz_content = "# Helper Quiz\n? Q1\n- A\n* B\n";
    let boundary = "----TestBoundary";
    let body = format!(
        "--{boundary}\r\nContent-Disposition: form-data; name=\"quiz_file\"; filename=\"quiz.txt\"\r\nContent-Type: text/plain\r\n\r\n{quiz_content}\r\n--{boundary}--\r\n"
    );

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/quiz")
                .header("Content-Type", format!("multipart/form-data; boundary={boundary}"))
                .body(Body::from(body))
                .unwrap(),
        )
        .await
        .unwrap();

    let body_bytes = response.into_body().collect().await.unwrap().to_bytes();
    let upload_json: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
    let quiz_id = upload_json["quiz_id"].as_str().unwrap();

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/sessions")
                .header("Content-Type", "application/json")
                .body(Body::from(format!(r#"{{"quiz_id":"{}"}}"#, quiz_id)))
                .unwrap(),
        )
        .await
        .unwrap();

    let body_bytes = response.into_body().collect().await.unwrap().to_bytes();
    let json: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
    json["join_code"].as_str().unwrap().to_string()
}

#[tokio::test]
async fn create_session_with_invalid_quiz_id_returns_404() {
    let app = test_app();

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/sessions")
                .header("Content-Type", "application/json")
                .body(Body::from(r#"{"quiz_id":"nonexistent"}"#))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

// === GET /api/sessions/:join_code ===

#[tokio::test]
async fn get_session_valid_code_returns_200() {
    let app = test_app();
    let join_code = setup_session(&app).await;

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri(format!("/api/sessions/{join_code}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(json["join_code"], join_code);
    assert_eq!(json["session_status"], "lobby");
    assert_eq!(json["player_count"], 0);
    assert!(json["quiz_title"].is_string());
    assert!(json["ws_url"].as_str().unwrap().starts_with("/ws/player/"));
}

#[tokio::test]
async fn get_session_invalid_code_returns_404() {
    let app = test_app();

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/sessions/XXXXXX")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(json["error"], "session_not_found");
}
