-- CreateEnum
CREATE TYPE "AiSubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateTable
CREATE TABLE "AiSubscription" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "username" TEXT,
    "passwordEnc" TEXT,
    "plan" TEXT,
    "cost" TEXT,
    "renewalDate" TIMESTAMP(3),
    "notes" TEXT,
    "status" "AiSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSubscription_pkey" PRIMARY KEY ("id")
);

