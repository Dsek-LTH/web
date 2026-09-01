-- CreateTable
CREATE TABLE "SongBookEntry" (
    "songId" UUID NOT NULL,
    "page" INTEGER NOT NULL,
    "numberOnPage" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "SongBookEntry_pkey" PRIMARY KEY ("page","numberOnPage")
);

-- CreateIndex
CREATE UNIQUE INDEX "SongBookEntry_songId_key" ON "SongBookEntry"("songId");

-- AddForeignKey
ALTER TABLE "SongBookEntry" ADD CONSTRAINT "SongBookEntry_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
