-- AddForeignKey
ALTER TABLE "api_access_policies" ADD CONSTRAINT "access_policies_member_id_foreign" FOREIGN KEY ("student_id") REFERENCES "members"("student_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "api_access_policies" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;