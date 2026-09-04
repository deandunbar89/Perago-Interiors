-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('PO', 'LPO', 'CONTRACT', 'QUOTE');

-- CreateEnum
CREATE TYPE "PaymentDirection" AS ENUM ('RECEIVED', 'PAID');

-- CreateTable
CREATE TABLE "ProjectOrder" (
    "id" TEXT NOT NULL,
    "pmProjectId" TEXT NOT NULL,
    "vendorId" TEXT,
    "type" "OrderType" NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "orderDate" TIMESTAMP(3),
    "documentId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectPayment" (
    "id" TEXT NOT NULL,
    "pmProjectId" TEXT NOT NULL,
    "direction" "PaymentDirection" NOT NULL,
    "orderId" TEXT,
    "vendorId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "reference" TEXT,
    "paidDate" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectOrder_documentId_key" ON "ProjectOrder"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectPayment_documentId_key" ON "ProjectPayment"("documentId");

-- AddForeignKey
ALTER TABLE "ProjectOrder" ADD CONSTRAINT "ProjectOrder_pmProjectId_fkey" FOREIGN KEY ("pmProjectId") REFERENCES "PmProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectOrder" ADD CONSTRAINT "ProjectOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectOrder" ADD CONSTRAINT "ProjectOrder_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "PmDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectOrder" ADD CONSTRAINT "ProjectOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPayment" ADD CONSTRAINT "ProjectPayment_pmProjectId_fkey" FOREIGN KEY ("pmProjectId") REFERENCES "PmProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPayment" ADD CONSTRAINT "ProjectPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ProjectOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPayment" ADD CONSTRAINT "ProjectPayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPayment" ADD CONSTRAINT "ProjectPayment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "PmDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPayment" ADD CONSTRAINT "ProjectPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

