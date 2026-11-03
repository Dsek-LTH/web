#!/usr/bin/env bash

docker compose up -d

printf '\nWaiting for database to start...\n'
until docker exec dsek-db pg_isready; do
    sleep 0.5
done
# Sometimes the database is not ready yet even though pg_isready returns true
sleep 0.5

# Apply migrations and seed the database (both run Go tools in backend/)
pnpm migrate
pnpm seed
