#!/bin/sh
set -e

echo "============================================"
echo "  PNW Tickets - Railway Startup"
echo "============================================"

# Debug: print all DB vars
echo "[DEBUG] DB_HOST='$DB_HOST'"
echo "[DEBUG] DB_PORT='$DB_PORT'"
echo "[DEBUG] DB_USERNAME='$DB_USERNAME'"
echo "[DEBUG] DB_DATABASE='$DB_DATABASE'"
echo "[DEBUG] REDIS_HOST='$REDIS_HOST'"

# Wait for Postgres using PHP (pg_isready may not be installed)
echo "[1/6] Waiting for PostgreSQL..."
RETRIES=0
until php -r "getenv('DB_HOST') || exit(1); new PDO('pgsql:host='.getenv('DB_HOST').';port='.getenv('DB_PORT').';dbname='.getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD'));" 2>&1; do
  RETRIES=$((RETRIES + 1))
  if [ "$RETRIES" -ge 20 ]; then
    echo "  FATAL: Could not connect to PostgreSQL after 60s. Check env vars."
    exit 1
  fi
  echo "  ...postgres not ready, retrying in 3s"
  sleep 3
done
echo "  ✓ PostgreSQL is ready"

# Wait for Redis (skip if not configured)
if [ -n "$REDIS_HOST" ]; then
  echo "[2/6] Checking Redis..."
  echo "  ✓ Redis configured (will verify on first use)"
else
  echo "[2/6] Skipping Redis (REDIS_HOST not set)"
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
