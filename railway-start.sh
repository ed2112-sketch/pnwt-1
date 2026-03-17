#!/bin/bash
set -e

echo "============================================"
echo "  PNW Tickets - Railway Startup"
echo "============================================"

# Wait for Postgres
echo "[1/6] Waiting for PostgreSQL..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" 2>/dev/null; do
  echo "  ...postgres not ready, retrying in 2s"
  sleep 2
done
echo "  ✓ PostgreSQL is ready"

# Wait for Redis
if [ -n "$REDIS_HOST" ]; then
  echo "[2/6] Waiting for Redis..."
  until redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" ping 2>/dev/null | grep -q PONG; do
    echo "  ...redis not ready, retrying in 2s"
    sleep 2
  done
  echo "  ✓ Redis is ready"
else
  echo "[2/6] Skipping Redis check (REDIS_HOST not set)"
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
