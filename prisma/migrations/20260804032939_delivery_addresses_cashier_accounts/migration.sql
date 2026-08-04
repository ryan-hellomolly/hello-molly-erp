-- CreateTable
CREATE TABLE "DeliveryAddress" (
    "id" UUID NOT NULL,
    "address" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashierAccount" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "routingNumber" TEXT,
    "accountNumber" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "address" TEXT,
    "notes" TEXT,
    "qrCodeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashierAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliveryAddress_sortOrder_idx" ON "DeliveryAddress"("sortOrder");

-- CreateIndex
CREATE INDEX "CashierAccount_name_idx" ON "CashierAccount"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CashierAccount_accountNumber_currency_key" ON "CashierAccount"("accountNumber", "currency");
