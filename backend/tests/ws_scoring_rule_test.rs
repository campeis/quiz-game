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
        question_time_sec: 30,
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

async fn recv_next(
    ws: &mut tokio_tungstenite::WebSocketStream<
        tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>,
    >,
) -> serde_json::Value {
    let msg = tokio::time::timeout(Duration::from_secs(5), ws.next())
        .await
        .expect("timed out waiting for message")
        .expect("stream ended")
        .expect("WebSocket error");
    serde_json::from_str(msg.to_text().unwrap()).unwrap()
}

async fn recv_of_type(
    ws: &mut tokio_tungstenite::WebSocketStream<
        tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>,
    >,
    msg_type: &str,
) -> serde_json::Value {
    for _ in 0..10 {
        let json = recv_next(ws).await;
        if json["type"].as_str() == Some(msg_type) {
            return json;
        }
    }
    panic!("did not receive message of type '{msg_type}'");
}

async fn send_msg(
    ws: &mut tokio_tungstenite::WebSocketStream<
        tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>,
    >,
    payload: serde_json::Value,
) {
    ws.send(Message::Text(payload.to_string().into()))
        .await
        .unwrap();
}

#[tokio::test]
async fn host_can_set_scoring_rule_in_lobby() {
    let addr = start_test_server().await;
    let quiz_id = upload_quiz(&addr, "# Test Quiz\n? Q1\n- Wrong\n* Right\n").await;
    let join_code = create_session(&addr, &quiz_id).await;

    let (mut host_ws, _) =
        tokio_tungstenite::connect_async(format!("ws://{addr}/ws/host/{join_code}"))
            .await
            .unwrap();

    let (mut player_ws, _) = tokio_tungstenite::connect_async(format!(
        "ws://{addr}/ws/player/{join_code}?name=Tester&avatar=🐸"
    ))
    .await
    .unwrap();

    // Drain player_joined from both connections
    recv_of_type(&mut host_ws, "player_joined").await;
    recv_of_type(&mut player_ws, "player_joined").await;

    // Host changes rule to linear_decay
    send_msg(
        &mut host_ws,
        serde_json::json!({"type": "set_scoring_rule", "payload": {"rule": "linear_decay"}}),
    )
    .await;

    // Both host and player must receive scoring_rule_set with the correct rule
    let host_msg = recv_of_type(&mut host_ws, "scoring_rule_set").await;
    assert_eq!(host_msg["payload"]["rule"], "linear_decay");

    let player_msg = recv_of_type(&mut player_ws, "scoring_rule_set").await;
    assert_eq!(player_msg["payload"]["rule"], "linear_decay");
}

#[tokio::test]
async fn set_scoring_rule_rejected_after_game_starts() {
    let addr = start_test_server().await;
    let quiz_id = upload_quiz(&addr, "# Test Quiz\n? Q1\n- Wrong\n* Right\n").await;
    let join_code = create_session(&addr, &quiz_id).await;

    let (mut host_ws, _) =
        tokio_tungstenite::connect_async(format!("ws://{addr}/ws/host/{join_code}"))
            .await
            .unwrap();

    let (mut player_ws, _) = tokio_tungstenite::connect_async(format!(
        "ws://{addr}/ws/player/{join_code}?name=Tester&avatar=🐸"
    ))
    .await
    .unwrap();

    recv_of_type(&mut host_ws, "player_joined").await;
    recv_of_type(&mut player_ws, "player_joined").await;

    // Start game
    send_msg(
        &mut host_ws,
        serde_json::json!({"type": "start_game", "payload": {}}),
    )
    .await;

    // Drain game_starting and question from both sides
    recv_of_type(&mut host_ws, "game_starting").await;
    recv_of_type(&mut player_ws, "game_starting").await;
    recv_of_type(&mut host_ws, "question").await;
    recv_of_type(&mut player_ws, "question").await;

    // Attempt to change rule after game started — should be silently ignored
    send_msg(
        &mut host_ws,
        serde_json::json!({"type": "set_scoring_rule", "payload": {"rule": "fixed_score"}}),
    )
    .await;

    // No scoring_rule_set should arrive within 300ms
    let result = tokio::time::timeout(Duration::from_millis(300), host_ws.next()).await;
    if let Ok(Some(Ok(msg))) = result {
        let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
        assert_ne!(
            json["type"].as_str(),
            Some("scoring_rule_set"),
            "scoring_rule_set must not be sent after game starts"
        );
    }
    // A timeout (Err) means no message was received — that's the correct behaviour
}

#[tokio::test]
async fn player_cannot_set_scoring_rule() {
    let addr = start_test_server().await;
    let quiz_id = upload_quiz(&addr, "# Test Quiz\n? Q1\n- Wrong\n* Right\n").await;
    let join_code = create_session(&addr, &quiz_id).await;

    let (mut host_ws, _) =
        tokio_tungstenite::connect_async(format!("ws://{addr}/ws/host/{join_code}"))
            .await
            .unwrap();

    let (mut player_ws, _) = tokio_tungstenite::connect_async(format!(
        "ws://{addr}/ws/player/{join_code}?name=Attacker&avatar=😈"
    ))
    .await
    .unwrap();

    recv_of_type(&mut host_ws, "player_joined").await;
    recv_of_type(&mut player_ws, "player_joined").await;

    // Player tries to set the scoring rule
    send_msg(
        &mut player_ws,
        serde_json::json!({"type": "set_scoring_rule", "payload": {"rule": "fixed_score"}}),
    )
    .await;

    // Neither host nor player should receive scoring_rule_set
    let host_result = tokio::time::timeout(Duration::from_millis(300), host_ws.next()).await;
    if let Ok(Some(Ok(msg))) = host_result {
        let json: serde_json::Value = serde_json::from_str(msg.to_text().unwrap()).unwrap();
        assert_ne!(json["type"].as_str(), Some("scoring_rule_set"));
    }
}
