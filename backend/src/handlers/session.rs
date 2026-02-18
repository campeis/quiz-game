use axum::Json;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use serde::Deserialize;
use serde_json::json;

use crate::AppState;
use crate::errors::AppError;

#[derive(Deserialize)]
pub struct CreateSessionRequest {
    pub quiz_id: String,
}

pub async fn create_session(
    State(state): State<AppState>,
    Json(req): Json<CreateSessionRequest>,
) -> Result<impl IntoResponse, AppError> {
    let quiz = state
        .session_manager
        .get_quiz(&req.quiz_id)
        .ok_or(AppError::QuizNotFound)?;

    let session = state.session_manager.create_session(quiz)?;
    let session_read = session.read().await;
    let join_code = session_read.join_code.clone();

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "join_code": join_code,
            "session_status": "lobby",
            "ws_url": format!("/ws/host/{}", join_code),
        })),
    ))
}

pub async fn get_session(
    State(state): State<AppState>,
    Path(join_code): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let session = state
        .session_manager
        .get_session(&join_code)
        .ok_or(AppError::SessionNotFound)?;

    let session_read = session.read().await;

    if !session_read.is_joinable() {
        return Err(AppError::SessionNotJoinable);
    }

    Ok(Json(json!({
        "join_code": session_read.join_code,
        "session_status": "lobby",
        "player_count": session_read.player_count(),
        "quiz_title": session_read.quiz.title,
        "ws_url": format!("/ws/player/{}", session_read.join_code),
    })))
}
