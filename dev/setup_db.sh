#!/bin/bash
docker run --name dsek-db -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dsek -d postgres:14-alpine
# Wait for postgres to start
until docker exec dsek-db pg_isready ; do sleep 0.5 ; done
# Set `session_replication_role` to `'replica'`, this will temporarily disable all foreign key checks. If you used the parameters for your postgresql docker container above the following command should work.
docker exec -it dsek-db psql -U postgres --dbname=dsek --command="SET session_replication_role = 'replica';"
# Restore old database from dump
curl -L "https://minio.api.sandbox.dsek.se/dev-files/dev/dwww_web.dmp" | docker exec -i dsek-db pg_restore -U postgres -d dsek -v
# Re-enable foreign key checks
docker exec -it dsek-db psql -U postgres --dbname=dsek --command="SET session_replication_role = 'origin';"
# Setup migrations for prisma
pnpm migrate --skip-seed