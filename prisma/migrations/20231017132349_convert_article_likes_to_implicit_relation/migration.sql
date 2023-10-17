/*
  Warnings:

  - You are about to drop the `article_likes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "article_likes" DROP CONSTRAINT "article_likes_article_id_foreign";

-- DropForeignKey
ALTER TABLE "article_likes" DROP CONSTRAINT "article_likes_member_id_foreign";


-- CreateTable
CREATE TABLE "_article_likes" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_article_likes_AB_unique" ON "_article_likes"("A", "B");

-- CreateIndex
CREATE INDEX "_article_likes_B_index" ON "_article_likes"("B");

-- AddForeignKey
ALTER TABLE "_article_likes" ADD CONSTRAINT "_article_likes_A_fkey" FOREIGN KEY ("A") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_article_likes" ADD CONSTRAINT "_article_likes_B_fkey" FOREIGN KEY ("B") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate over old data
INSERT INTO "_article_likes" ("A", "B") SELECT "article_id", "member_id" FROM "article_likes";

-- DropTable
DROP TABLE "article_likes";