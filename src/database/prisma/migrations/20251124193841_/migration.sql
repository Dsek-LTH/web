-- CreateTable
CREATE TABLE "sexetinventoryvaluelog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" TIMESTAMP(3) NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "sexetinventoryvaluelog_pkey" PRIMARY KEY ("id")
);
