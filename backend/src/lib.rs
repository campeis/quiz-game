pub mod config;
pub mod errors;
pub mod handlers;
pub mod models;
pub mod services;

use axum::routing::{get, post};
use axum::Router;
use tower_http::cors::CorsLayer;

use crate::config::AppConfig;
use crate::services::session_manager::SessionManager;

#[derive(Clone)]
pub struct AppState {
    pub session_manager: SessionManager,
    pub config: AppConfig,
}

pub fn build_router(session_manager: SessionManager, config: AppConfig) -> Router {
    let state = AppState {
        session_manager,
        config,
    };

    Router::new()
        .route("/api/health", get(|| async { "ok" }))
        .route("/api/quiz", post(handlers::quiz_upload::upload_quiz))
        .route("/api/sessions", post(handlers::session::create_session))
        .route(
            "/api/sessions/{join_code}",
            get(handlers::session::get_session),
        )
        .route("/ws/host/{join_code}", get(handlers::ws::ws_host))
        .route("/ws/player/{join_code}", get(handlers::ws::ws_player))
        .layer(CorsLayer::permissive())
        .with_state(state)
}
