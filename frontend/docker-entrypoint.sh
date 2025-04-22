#!/bin/sh

# Create a runtime .env file with the current environment variables
# This ensures environment variables from docker-compose are available to the React app

echo "Generating runtime environment variables..."

# Clear or create the .env file
> /app/.env.runtime

# Write environment variables to .env.runtime file
echo "REACT_APP_AUTH_SERVICE_URL=${REACT_APP_AUTH_SERVICE_URL}" >> /app/.env.runtime
echo "REACT_APP_ORDER_SERVICE_URL=${REACT_APP_ORDER_SERVICE_URL}" >> /app/.env.runtime
echo "REACT_APP_RESTAURANT_SERVICE_URL=${REACT_APP_RESTAURANT_SERVICE_URL}" >> /app/.env.runtime

echo "Environment variables generated:"
cat /app/.env.runtime

# Start the application
exec "$@" 