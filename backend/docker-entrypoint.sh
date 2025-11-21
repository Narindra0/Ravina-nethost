#!/bin/sh
set -e

# Handle JWT Keys from Environment Variables
if [ ! -z "$JWT_SECRET_KEY" ] && echo "$JWT_SECRET_KEY" | grep -q "\-\-\-\-\-BEGIN"; then
    echo "Extracting JWT Secret Key from env..."
    mkdir -p config/jwt
    echo "$JWT_SECRET_KEY" > config/jwt/private.pem
fi

if [ ! -z "$JWT_PUBLIC_KEY" ] && echo "$JWT_PUBLIC_KEY" | grep -q "\-\-\-\-\-BEGIN"; then
    echo "Extracting JWT Public Key from env..."
    mkdir -p config/jwt
    echo "$JWT_PUBLIC_KEY" > config/jwt/public.pem
fi

# Adjust Database URL for TiDB if needed (optional, but good for safety)
# If DATABASE_URL is set and contains tidbcloud, ensure SSL options are present?
# For now, we rely on the user providing the correct URL or Doctrine handling it.

# Run post-install steps (cache clear, assets install)
echo "Clearing cache and installing assets..."
php bin/console cache:clear
php bin/console assets:install public

# Run the command
exec "$@"
