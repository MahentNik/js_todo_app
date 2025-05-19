# Builder stage
FROM rust:1.82 as builder

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Правильная рабочая директория
WORKDIR /app/server_rust

# Копируем только Cargo файлы сначала
COPY ./server_rust/Cargo.toml ./server_rust/Cargo.lock ./

# Временная сборка зависимостей
RUN mkdir -p src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Копируем реальные исходники
COPY ./server_rust/src ./src

# Финальная сборка
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/server_rust/target/release/server_rust /usr/local/bin/

EXPOSE 8080
CMD ["server_rust"]