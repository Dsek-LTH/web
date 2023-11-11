
# Set `session_replication_role` to `'replica'`, this will temporarily disable all foreign key checks. If you used the parameters for your postgresql docker container above the following command should work.
docker exec -it postgres psql -U postgres --dbname=dwww_web --command="SET session_replication_role = 'replica';"
# Restore old database from dump
curl -L "https://minio.api.sandbox.dsek.se/dev-files/dev/dwww_web.dmp" | docker exec -i postgres pg_restore -U postgres -d dwww_web -v
# Re-enable foreign key checks
docker exec -it postgres psql -U postgres --dbname=dwww_web --command="SET session_replication_role = 'origin';"
# Setup migrations for prisma
pnpm migrate