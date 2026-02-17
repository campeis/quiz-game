use quiz_server::config::AppConfig;
use quiz_server::services::session_manager::SessionManager;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env().add_directive("info".parse().unwrap()))
        .init();

    let config = AppConfig::from_env();
    let session_manager = SessionManager::new(config.clone());

    let app = quiz_server::build_router(session_manager, config.clone());

    // Optionally serve static frontend files in production
    let app = if let Some(ref static_dir) = config.static_dir {
        app.fallback_service(tower_http::services::ServeDir::new(static_dir))
    } else {
        app
    };

    let addr = format!("0.0.0.0:{}", config.port);
    tracing::info!("Starting server on {}", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
