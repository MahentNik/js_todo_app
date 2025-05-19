use actix_web::{web, App, HttpServer, middleware::Logger};
use actix_cors::Cors;

mod db;
mod routes;
mod models;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    std::env::set_var("RUST_LOG", "actix_web=info");
    env_logger::init();

    println!("🟡 Starting server initialization...");

        let db = match db::connect_db().await {
            Ok(db) => {
                println!("✅ Database connection established");
                db
            },
            Err(e) => {
                println!("🔴 FATAL: Failed to connect to database: {}", e);
                std::process::exit(1);
            }
        };

    println!("🟡 Starting HTTP server...");
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .app_data(web::Data::new(db.clone()))
            .service(
                web::scope("/api")
                    .route("/todos", web::get().to(routes::get_todos))
                    .route("/todos", web::post().to(routes::create_todo))
                    .route("/todos/{id}", web::put().to(routes::update_todo))
                    .route("/todos/{id}", web::delete().to(routes::delete_todo))
                    .route("/categories", web::get().to(routes::get_categories))
            )
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}