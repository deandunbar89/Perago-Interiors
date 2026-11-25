-- Issued / superseded quotation marker on CRM and PM documents
CREATE TYPE "QuoteStatus" AS ENUM ('ISSUED', 'SUPERSEDED');

ALTER TABLE "Document" ADD COLUMN "quoteStatus" "QuoteStatus",
ADD COLUMN "issuedAt" TIMESTAMP(3),
ADD COLUMN "issuedValue" DOUBLE PRECISION;

ALTER TABLE "PmDocument" ADD COLUMN "quoteStatus" "QuoteStatus",
ADD COLUMN "issuedAt" TIMESTAMP(3),
ADD COLUMN "issuedValue" DOUBLE PRECISION;
