use mongodb::bson::oid::ObjectId;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Todo {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub title: String,
    pub description: String,
    pub priority: String,
    pub category: String,
    pub due_date: Option<String>,
    pub completed: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Category {
    pub name: String,
    pub color: String,
}