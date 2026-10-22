-- CreateEnum
CREATE TYPE "Emirate" AS ENUM ('DUBAI', 'ABU_DHABI', 'SHARJAH', 'AJMAN', 'RAS_AL_KHAIMAH', 'FUJAIRAH', 'UMM_AL_QUWAIN', 'OUTSIDE_UAE');

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "emirate" "Emirate",
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "yearsExperience" INTEGER;

