-- CreateTable
CREATE TABLE "song_book_entries" (
    "songId" UUID NOT NULL,
    "page" INTEGER NOT NULL,
    "numberOnPage" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "song_book_entries_pkey" PRIMARY KEY ("page","numberOnPage")
);

-- CreateIndex
CREATE UNIQUE INDEX "song_book_entries_songId_key" ON "song_book_entries"("songId");

-- AddForeignKey
ALTER TABLE "song_book_entries" ADD CONSTRAINT "song_book_entries_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
