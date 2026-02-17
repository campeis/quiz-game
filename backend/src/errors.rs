use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde_json::json;

#[derive(Debug)]
pub enum AppError {
    InvalidUpload(String),
    InvalidQuizFile(Vec<ParseError>),
    QuizNotFound,
    SessionNotFound,
    SessionNotJoinable,
    MaxSessionsReached,
    SessionFull,
    Internal(String),
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct ParseError {
    pub line: usize,
    pub message: String,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, body) = match self {
            AppError::InvalidUpload(msg) => (
                StatusCode::BAD_REQUEST,
                json!({ "error": "invalid_upload", "message": msg }),
            ),
            AppError::InvalidQuizFile(errors) => (
                StatusCode::BAD_REQUEST,
                json!({ "error": "invalid_quiz_file", "messages": errors }),
            ),
            AppError::QuizNotFound => (
                StatusCode::NOT_FOUND,
                json!({ "error": "quiz_not_found", "message": "No uploaded quiz found with the given ID. Please re-upload." }),
            ),
            AppError::SessionNotFound => (
                StatusCode::NOT_FOUND,
                json!({ "error": "session_not_found", "message": "No active game session found with that code." }),
            ),
            AppError::SessionNotJoinable => (
                StatusCode::CONFLICT,
                json!({ "error": "session_not_joinable", "message": "This game has already started and is no longer accepting new players." }),
            ),
            AppError::MaxSessionsReached => (
                StatusCode::CONFLICT,
                json!({ "error": "max_sessions_reached", "message": "Maximum number of concurrent game sessions reached. Please try again later." }),
            ),
            AppError::SessionFull => (
                StatusCode::CONFLICT,
                json!({ "error": "session_full", "message": "This game session is full." }),
            ),
            AppError::Internal(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                json!({ "error": "internal_error", "message": msg }),
            ),
        };

        (status, axum::Json(body)).into_response()
    }
}
