-- CreateTable
CREATE TABLE "ciabatta_of_the_week" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "year" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "ciabatta" TEXT NOT NULL,

    CONSTRAINT "ciabatta_of_the_week_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "week_year_unique" ON "ciabatta_of_the_week"("year", "week");
