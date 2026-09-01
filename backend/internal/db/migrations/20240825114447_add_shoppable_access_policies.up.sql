-- CreateTable
CREATE TABLE "shoppable_access_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shoppableId" UUID NOT NULL,
    "role" TEXT,
    "student_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shoppable_access_policies_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "shoppable_access_policies" ADD CONSTRAINT "shoppable_access_policies_shoppableId_fkey" FOREIGN KEY ("shoppableId") REFERENCES "shoppable"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shoppable_access_policies" ADD CONSTRAINT "access_policies_member_id_foreign" FOREIGN KEY ("student_id") REFERENCES "members"("student_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
