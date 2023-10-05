-- AddForeignKey
ALTER TABLE "AccessPolicy" ADD CONSTRAINT "AccessPolicy_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Member"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;
