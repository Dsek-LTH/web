#!/bin/bash
docker compose up -d

echo "\nWaiting for database to start..."
until docker exec dsek-db pg_isready
do
    sleep 0.5;
done
# Sometimes the database is not ready yet even though pg_isready returns true
sleep 0.5;

# Setup migrations for prisma and seed database
pnpm migrate
pnpm seed

# Initialize directus database
CONFIG_PATH="./cms/.env" pnpm dlx directus bootstrap
CONFIG_PATH="./cms/.env" pnpm dlx directus schema apply --yes ./cms/snapshot.yaml

# To make uploads work
docker compose exec -u root directus chown -R node:node /directus/extensions /directus/uploads

# Create admin role with id from the .env file that is assigned when logging in with keycloak
set -o allexport
source ./cms/.env
set +o allexport
# Get access token
ACCESS_TOKEN=`curl -s -X POST http://localhost:8055/auth/login -H "Content-Type: application/json" -d '{"email": "'"$ADMIN_EMAIL"'", "password": "'"$ADMIN_PASSWORD"'"}' | jq -r ".data.access_token"`
# Get the current admin role and change the id to the one from the env file
NEW_ROLE=`curl -s -X GET http://localhost:8055/roles -H "Authorization: Bearer $ACCESS_TOKEN" | \
  jq -r '.data.[0].id = "'"$AUTH_KEYCLOAK_DEFAULT_ROLE_ID"'"' | \
  jq -r ".data.[0]"`
# Create the new admin role with correct id
curl -X POST http://localhost:8055/roles -H "Content-Type: application/json" -H "Authorization: Bearer $ACCESS_TOKEN" -d "$NEW_ROLE"
# Set admin users static token to the one from the env file
curl -X PATCH http://localhost:8055/users/me -H "Content-Type: application/json" -H "Authorization: Bearer $ACCESS_TOKEN" -d '{"token": "'"$DIRECTUS_TOKEN"'"}'

# Set permissions on uploads folder so Directus can access it
docker compose exec -u root directus chown -R node:node /directus/extensions /directus/uploads