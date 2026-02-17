use axum::extract::{Multipart, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use crate::errors::AppError;
use crate::models::quiz::parse_quiz;
use crate::AppState;

pub async fn upload_quiz(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, AppError> {
    let mut file_content = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::InvalidUpload(e.to_string()))?
    {
        if field.name() == Some("quiz_file") {
            let bytes = field
                .bytes()
                .await
                .map_err(|e| AppError::InvalidUpload(e.to_string()))?;
            file_content = Some(
                String::from_utf8(bytes.to_vec())
                    .map_err(|_| AppError::InvalidUpload("File is not valid UTF-8".into()))?,
            );
            break;
        }
    }

    let content = file_content
        .ok_or_else(|| AppError::InvalidUpload("Expected a text file upload in the 'quiz_file' field".into()))?;

    let quiz = parse_quiz(&content, state.config.question_time_sec)
        .map_err(AppError::InvalidQuizFile)?;

    let preview: Vec<_> = quiz
        .questions
        .iter()
        .map(|q| {
            json!({
                "text": q.text,
                "option_count": q.options.len(),
            })
        })
        .collect();

    let quiz_id = uuid::Uuid::new_v4().to_string();
    let question_count = quiz.questions.len();
    let title = quiz.title.clone();

    state.session_manager.store_quiz(quiz_id.clone(), quiz);

    let mut response = json!({
        "title": title,
        "question_count": question_count,
        "preview": preview,
        "quiz_id": quiz_id,
    });

    if question_count > 100 {
        response["warning"] = json!("Quiz has more than 100 questions. This may result in very long game sessions.");
    }

    Ok((StatusCode::OK, Json(response)))
}
