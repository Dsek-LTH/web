#!/bin/bash
docker run \
       --name dsek-db \
       --publish 5432:5432 \
       --env POSTGRES_USER=postgres \
       --env POSTGRES_PASSWORD=postgres \
       --env POSTGRES_DB=dsek \
       --detach \
       postgres:14-alpine

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