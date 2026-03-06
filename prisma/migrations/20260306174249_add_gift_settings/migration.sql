-- CreateTable
CREATE TABLE "GiftSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "maxMessageLength" INTEGER NOT NULL DEFAULT 200,
    "wrappingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "GiftSettings_shop_key" ON "GiftSettings"("shop");
