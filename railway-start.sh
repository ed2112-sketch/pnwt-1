#!/bin/sh
set -e

echo "============================================"
echo "  PNW Tickets - Railway Startup"
echo "============================================"

# Parse DATABASE_URL if individual DB vars are not set
if [ -z "$DB_HOST" ] && [ -n "$DATABASE_URL" ]; then
  echo "[0/6] Parsing DATABASE_URL..."
  export DB_CONNECTION=pgsql
  export DB_USERNAME=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
  export DB_PASSWORD=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
  export DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
  export DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
  export DB_DATABASE=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
  echo "  DB_HOST=$DB_HOST DB_PORT=$DB_PORT DB_DATABASE=$DB_DATABASE DB_USERNAME=$DB_USERNAME"
fi

# Parse REDIS_URL if individual Redis vars are not set
if [ -z "$REDIS_HOST" ] && [ -n "$REDIS_URL" ]; then
  echo "[0/6] Parsing REDIS_URL..."
  export REDIS_HOST=$(echo "$REDIS_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
  export REDIS_PORT=$(echo "$REDIS_URL" | sed -n 's|.*:\([0-9]*\)$|\1|p')
  export REDIS_PASSWORD=$(echo "$REDIS_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
  echo "  REDIS_HOST=$REDIS_HOST REDIS_PORT=$REDIS_PORT"
fi

# Wait for Postgres
echo "[1/6] Waiting for PostgreSQL..."
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

# Check Redis
if [ -n "$REDIS_HOST" ]; then
  echo "[2/6] Redis configured at $REDIS_HOST:$REDIS_PORT"
else
  echo "[2/6] Skipping Redis (not configured)"
fi

# Laravel setup
echo "[3/6] Running Laravel setup..."
cd /var/www/html
php artisan storage:link --force 2>/dev/null || true
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
echo "  ✓ Laravel setup complete"

# Queue worker (background, only if Redis is available)
if [ "${QUEUE_CONNECTION}" != "sync" ] && [ -n "$REDIS_HOST" ]; then
  echo "[4/6] Starting queue worker..."
  php artisan queue:work --sleep=3 --tries=3 --max-time=3600 &
  echo "  ✓ Queue worker started (PID $!)"
else
  echo "[4/6] Queue worker skipped (using sync mode)"
fi

# Scheduler (background)
echo "[5/6] Starting Laravel scheduler..."
while true; do
  php /var/www/html/artisan schedule:run >> /dev/null 2>&1
  sleep 60
done &
echo "  ✓ Scheduler started (PID $!)"

# Web server
echo "[6/6] Starting PHP-FPM + Nginx..."
export NGINX_PORT="${PORT:-8080}"
sed -i "s/listen 8080/listen ${NGINX_PORT}/g" /etc/nginx/sites-available/default 2>/dev/null || true
sed -i "s/listen 80/listen ${NGINX_PORT}/g" /etc/nginx/conf.d/default.conf 2>/dev/null || true

php-fpm -D
nginx -g "daemon off;"
