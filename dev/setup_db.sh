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

pnpm dlx directus bootstrap
pnpm dlx directus schema apply --yes ./directus/schema.yaml
