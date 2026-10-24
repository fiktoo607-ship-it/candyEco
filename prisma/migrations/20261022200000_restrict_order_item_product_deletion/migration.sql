-- AlterForeignKey
-- Enforce ON DELETE RESTRICT between OrderItem and Product to prevent cascading deletion of historical order records (Issue #22)
ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_productId_fkey";

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
