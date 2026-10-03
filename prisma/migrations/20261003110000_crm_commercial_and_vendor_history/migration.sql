-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "commercialSectionId" TEXT;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "rating" INTEGER;

-- CreateTable
CREATE TABLE "CrmCommercialSection" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mode" "UploadMode" NOT NULL DEFAULT 'MULTIPLE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmCommercialSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorProjectHistory" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "pmProjectId" TEXT,
    "projectName" TEXT NOT NULL,
    "workedOn" TIMESTAMP(3),
    "scope" TEXT,
    "rating" INTEGER,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorProjectHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrmCommercialSection_projectId_name_key" ON "CrmCommercialSection"("projectId", "name");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_commercialSectionId_fkey" FOREIGN KEY ("commercialSectionId") REFERENCES "CrmCommercialSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmCommercialSection" ADD CONSTRAINT "CrmCommercialSection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProjectHistory" ADD CONSTRAINT "VendorProjectHistory_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProjectHistory" ADD CONSTRAINT "VendorProjectHistory_pmProjectId_fkey" FOREIGN KEY ("pmProjectId") REFERENCES "PmProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProjectHistory" ADD CONSTRAINT "VendorProjectHistory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
