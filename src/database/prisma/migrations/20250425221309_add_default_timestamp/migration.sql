-- This migration is cursed. It has already been applied in 20250130215404_improve_keycloak_sync,
-- but Prisma still insists that it is missing so we apply it again to make Prisma happy.
ALTER TABLE "mandates" ALTER COLUMN "last_synced" SET DEFAULT TIMESTAMP '1970-01-01 00:00:00';
