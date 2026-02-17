use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use tokio::net::TcpListener;
use tokio_tungstenite::tungstenite::Message;

use quiz_server::config::AppConfig;
use quiz_server::services::session_manager::SessionManager;

fn test_config() -> AppConfig {
    AppConfig {
        port: 0,
        max_sessions: 10,
        max_players: 50,
        question_time_sec: 30, // long enough to not auto-expire during test
        reconnect_timeout_sec: 120,
        static_dir: None,
    }
}

async fn start_test_server() -> String {
    let config = test_config();
    let session_manager = SessionManager::new(config.clone());
    let app = quiz_server::build_router(session_manager, config);

    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();

    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });

    format!("127.0.0.1:{}", addr.port())
}

async fn upload_quiz(addr: &str, content: &str) -> String {
    let client = reqwest::Client::new();
    let form = reqwest::multipart::Form::new().part(
        "quiz_file",
        reqwest::multipart::Part::text(content.to_string())
            .file_name("quiz.txt")
            .mime_str("text/plain")
            .unwrap(),
    );

    let resp = client
        .post(format!("http://{addr}/api/quiz"))
        .multipart(form)
        .send()
        .await
        .unwrap();

    assert_eq!(resp.status(), 200);
    let json: serde_json::Value = resp.json().await.unwrap();
    json["quiz_id"].as_str().unwrap().to_string()
}

async fn create_session(addr: &str, quiz_id: &str) -> String {
    let client = reqwest::Client::new();
    let resp = client
        .post(format!("http://{addr}/api/sessions"))
        .json(&serde_json::json!({ "quiz_id": quiz_id }))
        .send()
        .await
        .unwrap();

    assert_eq!(resp.status(), 201);
    let json: serde_json::Value = resp.json().await.unwrap();
    json["join_code"].as_str().unwrap().to_string()
}

#[tokio::test]
async fn host_game_flow_upload_create_start_finish() {
    let addr = start_test_server().await;

    let quiz_content = "# Integration Test Quiz\n? Q1\n- A\n* B\n? Q2\n* X\n- Y\n";
    let quiz_id = upload_quiz(&addr, quiz_content).await;
    let join_code = create_session(&addr, &quiz_id).await;

    // Host connects via WebSocket
    let (mut host_ws, _) = tokio_tungstenite::connect_async(format!("ws://{addr}/ws/host/{join_code}"))
        .await
        .unwrap();

    // Player connects via WebSocket
    let (mut player_ws, _) = tokio_tungstenite::connect_async(format!(
        "ws://{addr}/ws/player/{join_code}?name=TestPlayer"
    ))
    .await
    .unwrap();

    // Host should receive player_joined
    let msg = tokio::time::timeout(Duration::from_secs(10), host_ws.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
    assert_eq!(json["type"], "player_joined");
    assert_eq!(json["payload"]["display_name"], "TestPlayer");

    // Player should also receive player_joined (their own join)
    let msg = tokio::time::timeout(Duration::from_secs(10), player_ws.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
    assert_eq!(json["type"], "player_joined");

    // Host starts the game
    host_ws
        .send(Message::Text(
            serde_json::json!({"type": "start_game", "payload": {}}).to_string().into(),
        ))
        .await
        .unwrap();

    // Both should receive game_starting
    let msg = tokio::time::timeout(Duration::from_secs(10), host_ws.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
    assert_eq!(json["type"], "game_starting");
    assert_eq!(json["payload"]["total_questions"], 2);

    let msg = tokio::time::timeout(Duration::from_secs(10), player_ws.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
    assert_eq!(json["type"], "game_starting");

    // Both should receive first question
    let msg = tokio::time::timeout(Duration::from_secs(10), host_ws.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
    assert_eq!(json["type"], "question");
    assert_eq!(json["payload"]["question_index"], 0);

    let msg = tokio::time::timeout(Duration::from_secs(10), player_ws.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
    assert_eq!(json["type"], "question");

    // Player submits answer
    player_ws
        .send(Message::Text(
            serde_json::json!({
                "type": "submit_answer",
                "payload": {"question_index": 0, "selected_index": 1}
            })
            .to_string().into(),
        ))
        .await
        .unwrap();

    // Player should receive answer_result
    let msg = tokio::time::timeout(Duration::from_secs(10), player_ws.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
    assert_eq!(json["type"], "answer_result");
    assert_eq!(json["payload"]["correct"], true);

    // Host should receive answer_count
    let msg = tokio::time::timeout(Duration::from_secs(10), host_ws.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
    assert_eq!(json["type"], "answer_count");
    assert_eq!(json["payload"]["answered"], 1);
    assert_eq!(json["payload"]["total"], 1);

    // Since all players answered, question should end and next question starts
    // Host receives question_ended
    let msg = tokio::time::timeout(Duration::from_secs(10), host_ws.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
    assert_eq!(json["type"], "question_ended");

    // Player receives question_ended
    let msg = tokio::time::timeout(Duration::from_secs(10), player_ws.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
    assert_eq!(json["type"], "question_ended");

    // Both receive next question
    let msg = tokio::time::timeout(Duration::from_secs(10), host_ws.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
    assert_eq!(json["type"], "question");
    assert_eq!(json["payload"]["question_index"], 1);

    let msg = tokio::time::timeout(Duration::from_secs(10), player_ws.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
    assert_eq!(json["type"], "question");

    // Player answers question 2
    player_ws
        .send(Message::Text(
            serde_json::json!({
                "type": "submit_answer",
                "payload": {"question_index": 1, "selected_index": 0}
            })
            .to_string().into(),
        ))
        .await
        .unwrap();

    // Player receives answer_result
    let msg = tokio::time::timeout(Duration::from_secs(10), player_ws.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
    assert_eq!(json["type"], "answer_result");
    assert_eq!(json["payload"]["correct"], true);

    // Host receives answer_count
    let msg = tokio::time::timeout(Duration::from_secs(10), host_ws.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
    assert_eq!(json["type"], "answer_count");

    // question_ended for Q2
    let msg = tokio::time::timeout(Duration::from_secs(10), host_ws.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
    assert_eq!(json["type"], "question_ended");

    let msg = tokio::time::timeout(Duration::from_secs(10), player_ws.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
    assert_eq!(json["type"], "question_ended");

    // Both should receive game_finished (last question was Q2)
    let msg = tokio::time::timeout(Duration::from_secs(10), host_ws.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
    assert_eq!(json["type"], "game_finished");
    assert!(json["payload"]["leaderboard"].is_array());

    let msg = tokio::time::timeout(Duration::from_secs(10), player_ws.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
    assert_eq!(json["type"], "game_finished");
}
