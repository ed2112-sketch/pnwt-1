#!/bin/sh
set -e

echo "============================================"
echo "  PNW Tickets - Railway Startup"
echo "============================================"

# Parse DATABASE_URL if individual DB vars are not set
if [ -z "$DB_HOST" ] && [ -n "$DATABASE_URL" ]; then
  echo "[1/3] Parsing DATABASE_URL..."
  export DB_CONNECTION=pgsql
  export DB_USERNAME=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
  export DB_PASSWORD=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
  export DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
  export DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
  export DB_DATABASE=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
  echo "  DB_HOST=$DB_HOST DB_PORT=$DB_PORT DB_DATABASE=$DB_DATABASE"
fi

# Parse REDIS_URL if individual Redis vars are not set
if [ -z "$REDIS_HOST" ] && [ -n "$REDIS_URL" ]; then
  echo "[1/3] Parsing REDIS_URL..."
  export REDIS_HOST=$(echo "$REDIS_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
  export REDIS_PORT=$(echo "$REDIS_URL" | sed -n 's|.*:\([0-9]*\)$|\1|p')
  export REDIS_PASSWORD=$(echo "$REDIS_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
  echo "  REDIS_HOST=$REDIS_HOST REDIS_PORT=$REDIS_PORT"
fi

# Wait for Postgres
echo "[2/3] Waiting for PostgreSQL..."
RETRIES=0
until php -r "new PDO('pgsql:host='.getenv('DB_HOST').';port='.getenv('DB_PORT').';dbname='.getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD'));" 2>&1; do
  RETRIES=$((RETRIES + 1))
  if [ "$RETRIES" -ge 20 ]; then
    echo "  FATAL: Could not connect to PostgreSQL after 60s."
    exit 1
  fi
  echo "  ...postgres not ready, retrying in 3s"
  sleep 3
done
echo "  ✓ PostgreSQL is ready"

# Set Nginx to listen on Railway's dynamic PORT
if [ -n "$PORT" ]; then
  export NGINX_LISTEN_PORT="$PORT"
  export SSL_MODE=off
  # Also patch Nginx configs directly in case the env var isn't picked up
  find /etc/nginx -name '*.conf' -exec sed -i "s/listen 80;/listen $PORT;/g" {} \; 2>/dev/null || true
  find /etc/nginx -name '*.conf' -exec sed -i "s/listen 8080;/listen $PORT;/g" {} \; 2>/dev/null || true
  find /etc/nginx -name '*.conf' -exec sed -i "s/listen 443/listen $PORT/g" {} \; 2>/dev/null || true
  echo "[3/4] Nginx configured for port $PORT"
fi

# Hand off to the base image startup script
echo "[4/4] Starting application via base image startup..."
exec /startup.sh
