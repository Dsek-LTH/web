-- CreateTable
CREATE TABLE "_alerts_closed_by" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_alerts_closed_by_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_alerts_closed_by_B_index" ON "_alerts_closed_by"("B");

-- AddForeignKey
ALTER TABLE "_alerts_closed_by" ADD CONSTRAINT "_alerts_closed_by_A_fkey" FOREIGN KEY ("A") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_alerts_closed_by" ADD CONSTRAINT "_alerts_closed_by_B_fkey" FOREIGN KEY ("B") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
