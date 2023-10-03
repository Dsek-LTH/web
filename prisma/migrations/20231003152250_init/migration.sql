-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "header" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "imageUrl" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latest_edit_datetime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleLike" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "ArticleLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "articleId" TEXT,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Author" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "mandateId" TEXT,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "nickname" TEXT,
    "picture_path" TEXT,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mandate" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "positionId" TEXT NOT NULL,

    CONSTRAINT "Mandate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArticleToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Member_student_id_key" ON "Member"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "_ArticleToTag_AB_unique" ON "_ArticleToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_ArticleToTag_B_index" ON "_ArticleToTag"("B");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleLike" ADD CONSTRAINT "ArticleLike_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleLike" ADD CONSTRAINT "ArticleLike_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Author" ADD CONSTRAINT "Author_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Author" ADD CONSTRAINT "Author_mandateId_fkey" FOREIGN KEY ("mandateId") REFERENCES "Mandate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mandate" ADD CONSTRAINT "Mandate_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mandate" ADD CONSTRAINT "Mandate_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleToTag" ADD CONSTRAINT "_ArticleToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleToTag" ADD CONSTRAINT "_ArticleToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
