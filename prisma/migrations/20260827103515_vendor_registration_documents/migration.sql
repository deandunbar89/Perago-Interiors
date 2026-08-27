-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "tradeLicenseDocId" TEXT,
ADD COLUMN     "trnCertDocId" TEXT;

-- CreateTable
CREATE TABLE "VendorDocument" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_tradeLicenseDocId_key" ON "Vendor"("tradeLicenseDocId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_trnCertDocId_key" ON "Vendor"("trnCertDocId");

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_tradeLicenseDocId_fkey" FOREIGN KEY ("tradeLicenseDocId") REFERENCES "VendorDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_trnCertDocId_fkey" FOREIGN KEY ("trnCertDocId") REFERENCES "VendorDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorDocument" ADD CONSTRAINT "VendorDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

