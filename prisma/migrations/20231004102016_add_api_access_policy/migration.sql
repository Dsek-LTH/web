-- CreateTable
CREATE TABLE "ApiAccessPolicy" (
    "id" TEXT NOT NULL,
    "api_name" TEXT NOT NULL,
    "role" TEXT,
    "student_id" TEXT,

    CONSTRAINT "ApiAccessPolicy_pkey" PRIMARY KEY ("id")
);
