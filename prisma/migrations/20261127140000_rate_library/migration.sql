-- Rate library
CREATE TABLE "RateItem" (
    "id" TEXT NOT NULL,
    "trade" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "rateType" TEXT NOT NULL DEFAULT 'SUPPLY_INSTALL',
    "source" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'CONTRACTOR_QUOTE',
    "sourceRef" TEXT,
    "projectName" TEXT,
    "quotedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RateItem_trade_idx" ON "RateItem"("trade");
CREATE INDEX "RateItem_quotedAt_idx" ON "RateItem"("quotedAt");

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'RATES';
