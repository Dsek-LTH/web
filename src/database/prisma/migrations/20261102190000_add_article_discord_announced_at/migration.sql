-- AlterTable
ALTER TABLE "articles" ADD COLUMN "discord_announced_at" TIMESTAMPTZ(6);

-- Articles that are already live have had their chance to be posted, so they
-- must not be posted again if a leftover scheduled task fires for them.
UPDATE "articles" SET "discord_announced_at" = "published_datetime" WHERE "published_datetime" <= now();
