
# To Do App
Простое веб-приложение для управления задачами с использованием MongoDB, Express и чистого JavaScript.

# Технологии

- Frontend: HTML5, CSS3, JavaScript (без фреймворков)

- Backend: Node.js, Express

- Database: MongoDB

- Containerization: Docker

# Установка и запуск

## С Docker (рекомендуется)
1. Убедитесь, что у вас установлены Docker и Docker Compose

https://www.docker.com/products/docker-desktop/

2. Клонируйте репозиторий:
---        
    git clone https://github.com/MahentNik/js_todo_app.git
    
    cd js_todo_app
    
3. Запустите приложение:

---
    docker-compose up --build

4. Приложение будет доступно по адресу:

    http://localhost:8080

## Без Docker (не рекомендуется)
Убедитесь, что у вас установлены Node.js (v14+) и MongoDB

1. Клонируйте репозиторий:
---        
    git clone https://github.com/MahentNik/js_todo_app.git
    
    cd js_todo_app

2. Установите зависимости:

---
    npm install
3. Запустите MongoDB (если не запущена)

4. Запустите сервер:
---
    npm start
5. Приложение будет доступно по адресу:
    http://localhost:8080


