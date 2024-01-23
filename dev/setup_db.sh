#!/bin/bash
source /run/current-system/profile/etc/profile.d/nix.sh
docker run \
       --name dsek-db \
       --publish 5432:5432 \
       -e POSTGRES_USER=postgres \
       -e POSTGRES_PASSWORD=postgres \
       -e POSTGRES_DB=dsek \
       --detach \
       postgres:14-alpine

# Wait for postgres to start
until docker exec dsek-db pg_isready
do
    sleep 0.5;
done

# Set `session_replication_role` to `'replica'`, this will temporarily disable
# all foreign key checks. If you used the parameters for your postgresql docker
# container above the following command should work.
docker exec --interactive --tty dsek-db \
       psql --username postgres \
            --dbname=dsek \
            --command="SET session_replication_role = 'replica';"

# Restore old database from dump
curl -L "https://minio.api.sandbox.dsek.se/dev-files/dev/dwww_web.dmp" | \
    docker exec --interactive dsek-db \
           pg_restore --username=postgres \
                      --dbname=dsek \
                      --verbose

# Re-enable foreign key checks
docker exec --interactive --tty dsek-db \
       psql --username postgres \
            --dbname=dsek \
            --command="SET session_replication_role = 'origin';"

# Setup migrations for prisma
pnpm migrate
