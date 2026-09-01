-- AddForeignKey
DELETE FROM "expo_tokens" WHERE "member_id" NOT IN (SELECT "id" FROM "members");
ALTER TABLE "expo_tokens" ADD CONSTRAINT "expo_tokens_member_id_foreign" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
