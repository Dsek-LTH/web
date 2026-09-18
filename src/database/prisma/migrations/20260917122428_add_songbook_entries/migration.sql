-- CreateTable
CREATE TABLE "song_book_entries" (
    "song_id" UUID NOT NULL,
    "page" INTEGER NOT NULL,
    "number_on_page" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "song_book_entries_pkey" PRIMARY KEY ("page","number_on_page")
);

-- CreateIndex
CREATE UNIQUE INDEX "song_book_entries_song_id_key" ON "song_book_entries"("song_id");

-- AddForeignKey
ALTER TABLE "song_book_entries" ADD CONSTRAINT "song_book_entries_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
