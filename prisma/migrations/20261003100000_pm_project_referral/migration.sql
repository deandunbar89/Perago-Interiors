-- AlterTable
ALTER TABLE "PmProject" ADD COLUMN     "referralDetails" TEXT,
ADD COLUMN     "referrerContact" TEXT,
ADD COLUMN     "referrerName" TEXT;

-- Existing PM projects promoted from a CRM tender inherit that tender's referral details.
UPDATE "PmProject" AS pm
SET "referrerName" = p."referrerName",
    "referrerContact" = p."referrerContact",
    "referralDetails" = p."referralDetails"
FROM "Project" AS p
WHERE pm."linkedTenderId" = p."id"
  AND (p."referrerName" IS NOT NULL OR p."referrerContact" IS NOT NULL OR p."referralDetails" IS NOT NULL);
