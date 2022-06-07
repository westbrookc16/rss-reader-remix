-- CreateTable
CREATE TABLE "ReadItem" (
    "userId" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "ReadItem_pkey" PRIMARY KEY ("userId","itemId")
);

-- AddForeignKey
ALTER TABLE "ReadItem" ADD CONSTRAINT "ReadItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadItem" ADD CONSTRAINT "ReadItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
