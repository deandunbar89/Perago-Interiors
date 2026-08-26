-- CreateEnum
CREATE TYPE "UploadMode" AS ENUM ('SINGLE', 'MULTIPLE');

-- CreateEnum
CREATE TYPE "SnagStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterEnum
ALTER TYPE "PmDocCategory" ADD VALUE 'OPERATIONS';

-- AlterTable
ALTER TABLE "PmDocument" ADD COLUMN     "subsectionId" TEXT;

-- CreateTable
CREATE TABLE "PmDocSubsection" (
    "id" TEXT NOT NULL,
    "pmProjectId" TEXT NOT NULL,
    "category" "PmDocCategory" NOT NULL,
    "alsoInCategory" "PmDocCategory",
    "name" TEXT NOT NULL,
    "mode" "UploadMode" NOT NULL DEFAULT 'MULTIPLE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PmDocSubsection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snag" (
    "id" TEXT NOT NULL,
    "pmProjectId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "SnagStatus" NOT NULL DEFAULT 'OPEN',
    "openPhotoId" TEXT NOT NULL,
    "closedPhotoId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Snag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PmDocSubsection_pmProjectId_category_name_key" ON "PmDocSubsection"("pmProjectId", "category", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Snag_openPhotoId_key" ON "Snag"("openPhotoId");

-- CreateIndex
CREATE UNIQUE INDEX "Snag_closedPhotoId_key" ON "Snag"("closedPhotoId");

-- AddForeignKey
ALTER TABLE "PmDocSubsection" ADD CONSTRAINT "PmDocSubsection_pmProjectId_fkey" FOREIGN KEY ("pmProjectId") REFERENCES "PmProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmDocument" ADD CONSTRAINT "PmDocument_subsectionId_fkey" FOREIGN KEY ("subsectionId") REFERENCES "PmDocSubsection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snag" ADD CONSTRAINT "Snag_pmProjectId_fkey" FOREIGN KEY ("pmProjectId") REFERENCES "PmProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snag" ADD CONSTRAINT "Snag_openPhotoId_fkey" FOREIGN KEY ("openPhotoId") REFERENCES "PmDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snag" ADD CONSTRAINT "Snag_closedPhotoId_fkey" FOREIGN KEY ("closedPhotoId") REFERENCES "PmDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snag" ADD CONSTRAINT "Snag_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
