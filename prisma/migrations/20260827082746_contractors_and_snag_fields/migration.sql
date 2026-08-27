-- CreateEnum
CREATE TYPE "SnagPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "SnagCategory" AS ENUM ('SNAG', 'DEFECT', 'PUNCH_ITEM');

-- CreateEnum
CREATE TYPE "Trade" AS ENUM ('ELECTRICAL', 'PLUMBING', 'HVAC_MEP', 'CARPENTRY', 'PAINTING', 'FLOORING', 'CEILING', 'GLAZING', 'CIVIL_STRUCTURAL', 'FURNITURE_JOINERY', 'OTHER');

-- AlterTable
ALTER TABLE "Snag" ADD COLUMN     "category" "SnagCategory" NOT NULL DEFAULT 'SNAG',
ADD COLUMN     "contractorId" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "priority" "SnagPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "trade" "Trade";

-- CreateTable
CREATE TABLE "Contractor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trade" "Trade",
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contractor_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Snag" ADD CONSTRAINT "Snag_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
