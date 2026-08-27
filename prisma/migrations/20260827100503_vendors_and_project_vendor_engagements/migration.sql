/*
  Warnings:

  - You are about to drop the column `contractorId` on the `Snag` table. All the data in the column will be lost.
  - You are about to drop the `Contractor` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('SUPPLIER', 'CONTRACTOR');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "VendorDocType" AS ENUM ('INVOICE', 'PURCHASE_ORDER', 'LPO', 'QUOTE');

-- AlterEnum
ALTER TYPE "Trade" ADD VALUE 'TILING';

-- DropForeignKey
ALTER TABLE "Snag" DROP CONSTRAINT "Snag_contractorId_fkey";

-- AlterTable
ALTER TABLE "PmDocument" ADD COLUMN     "pmProjectVendorId" TEXT,
ADD COLUMN     "vendorDocType" "VendorDocType";

-- AlterTable
ALTER TABLE "Snag" DROP COLUMN "contractorId",
ADD COLUMN     "vendorId" TEXT;

-- DropTable
DROP TABLE "Contractor";

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "VendorType" NOT NULL,
    "trade" "Trade",
    "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "website" TEXT,
    "trnNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PmProjectVendor" (
    "id" TEXT NOT NULL,
    "pmProjectId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PmProjectVendor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PmProjectVendor_pmProjectId_vendorId_key" ON "PmProjectVendor"("pmProjectId", "vendorId");

-- AddForeignKey
ALTER TABLE "PmDocument" ADD CONSTRAINT "PmDocument_pmProjectVendorId_fkey" FOREIGN KEY ("pmProjectVendorId") REFERENCES "PmProjectVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snag" ADD CONSTRAINT "Snag_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmProjectVendor" ADD CONSTRAINT "PmProjectVendor_pmProjectId_fkey" FOREIGN KEY ("pmProjectId") REFERENCES "PmProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmProjectVendor" ADD CONSTRAINT "PmProjectVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
