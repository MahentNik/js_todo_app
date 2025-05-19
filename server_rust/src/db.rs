use mongodb::{Client, options::ClientOptions};
use std::time::Duration;
use tokio::time::sleep;

pub async fn connect_db() -> mongodb::error::Result<mongodb::Database> {
    let mut attempts = 0;
    loop {
        match ClientOptions::parse("mongodb://mongodb:27017").await {
            Ok(client_options) => {
                match Client::with_options(client_options) {
                    Ok(client) => {
                        println!("✅ Successfully connected to MongoDB");
                        return Ok(client.database("todoapp"));
                    },
                    Err(e) => {
                        println!("⚠️ Failed to create MongoDB client: {}. Retrying...", e);
                    }
                }
            },
            Err(e) => {
                println!("⚠️ Failed to parse connection string: {}. Retrying...", e);
            }
        }

        attempts += 1;
        if attempts >= 10 {
            return Err(mongodb::error::Error::custom("Failed to connect to MongoDB after 10 attempts"));
        }

        sleep(Duration::from_secs(2)).await;
    }
}