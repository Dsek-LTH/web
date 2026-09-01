-- AddForeignKey
ALTER TABLE "door_access_policies" ADD CONSTRAINT "door_access_policies_member_id_foreign" FOREIGN KEY ("student_id") REFERENCES "members"("student_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
