-- CreateTable
CREATE TABLE "readme" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "year" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "published_at" TIMESTAMPTZ(6),

    CONSTRAINT "readme_pkey" PRIMARY KEY ("id")
);
