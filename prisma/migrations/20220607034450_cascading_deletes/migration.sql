-- DropForeignKey
ALTER TABLE "ReadItem" DROP CONSTRAINT "ReadItem_itemId_fkey";

-- AddForeignKey
ALTER TABLE "ReadItem" ADD CONSTRAINT "ReadItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
