-- CreateTable
CREATE TABLE "discord_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "discord_id" VARCHAR(255),
    "secret_code" VARCHAR(255),

    CONSTRAINT "discord_members_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "discord_members" ADD CONSTRAINT "discord_members_member_id_foreign" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
