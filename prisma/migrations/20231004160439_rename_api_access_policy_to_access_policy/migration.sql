/*
  Warnings:

  - You are about to drop the `ApiAccessPolicy` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ApiAccessPolicy";

-- CreateTable
CREATE TABLE "AccessPolicy" (
    "id" TEXT NOT NULL,
    "api_name" TEXT NOT NULL,
    "role" TEXT,
    "student_id" TEXT,

    CONSTRAINT "AccessPolicy_pkey" PRIMARY KEY ("id")
);
