FROM node:18-alpine
WORKDIR /usr/src/js_todo_app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]