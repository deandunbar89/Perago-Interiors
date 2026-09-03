-- CreateEnum
CREATE TYPE "ReportSection" AS ENUM ('SITE_PROGRESS', 'COMMERCIAL', 'PROCUREMENT', 'HSE', 'DESIGN');

-- CreateEnum
CREATE TYPE "ReportPeriodType" AS ENUM ('WEEKLY', 'MONTHLY');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'REPORTS';

-- CreateTable
CREATE TABLE "ProjectReportEntry" (
    "id" TEXT NOT NULL,
    "pmProjectId" TEXT NOT NULL,
    "section" "ReportSection" NOT NULL,
    "periodType" "ReportPeriodType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectReportEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProjectReportEntry" ADD CONSTRAINT "ProjectReportEntry_pmProjectId_fkey" FOREIGN KEY ("pmProjectId") REFERENCES "PmProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReportEntry" ADD CONSTRAINT "ProjectReportEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

