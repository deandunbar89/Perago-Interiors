-- AlterTable
ALTER TABLE "User" ADD COLUMN     "allowedSections" TEXT[] DEFAULT ARRAY[]::TEXT[];


-- Backfill existing accounts to full access so nobody loses access to a section
-- they already used, before this feature existed to restrict anything.
UPDATE "User" SET "allowedSections" = ARRAY['CRM','PM','TASKS','SNAGS','VENDORS','AI']::TEXT[];
