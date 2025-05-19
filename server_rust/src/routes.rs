use actix_web::{web, HttpResponse, Responder};
use mongodb::{Database, bson::{doc, oid::ObjectId}};
use futures_util::TryStreamExt;
use crate::models::{Todo, Category};

pub async fn get_todos(db: web::Data<Database>) -> impl Responder {
    let collection = db.collection::<Todo>("todos");
    match collection.find(None, None).await {
        Ok(cursor) => {
            let todos: Result<Vec<Todo>, _> = cursor.try_collect().await;
            match todos {
                Ok(t) => HttpResponse::Ok().json(t),
                Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
            }
        }
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

pub async fn create_todo(db: web::Data<Database>, item: web::Json<Todo>) -> impl Responder {
    let collection = db.collection("todos");
    match collection.insert_one(item.into_inner(), None).await {
        Ok(_) => HttpResponse::Created().finish(),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

pub async fn update_todo(
    db: web::Data<Database>,
    id: web::Path<String>,
    item: web::Json<Todo>,
) -> impl Responder {
    let collection = db.collection("todos");
    let oid = match ObjectId::parse_str(&id) {
        Ok(id) => id,
        Err(_) => return HttpResponse::BadRequest().body("Invalid ID format"),
    };

    match collection.update_one(
        doc! { "_id": oid },
        doc! { "$set": bson::to_bson(&item.into_inner()).unwrap() },
        None,
    ).await {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

pub async fn delete_todo(db: web::Data<Database>, id: web::Path<String>) -> impl Responder {
    let collection = db.collection("todos");
    let oid = match ObjectId::parse_str(&id) {
        Ok(id) => id,
        Err(_) => return HttpResponse::BadRequest().body("Invalid ID format"),
    };

    match collection.delete_one(doc! { "_id": oid }, None).await {
        Ok(_) => HttpResponse::NoContent().finish(),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

pub async fn get_categories(db: web::Data<Database>) -> impl Responder {
    let collection = db.collection::<Category>("categories");
    match collection.find(None, None).await {
        Ok(cursor) => {
            let categories: Result<Vec<Category>, _> = cursor.try_collect().await;
            match categories {
                Ok(c) => HttpResponse::Ok().json(c),
                Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
            }
        }
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}