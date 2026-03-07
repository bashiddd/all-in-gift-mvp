-- CreateTable
CREATE TABLE "GiftOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "recipientName" TEXT,
    "message" TEXT,
    "wrapping" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "GiftOrder_orderId_key" ON "GiftOrder"("orderId");

-- CreateIndex
CREATE INDEX "GiftOrder_shop_createdAt_idx" ON "GiftOrder"("shop", "createdAt");
