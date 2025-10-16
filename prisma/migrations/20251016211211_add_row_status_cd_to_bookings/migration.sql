-- AlterTable
ALTER TABLE "public"."bookings" ADD COLUMN "rowStatusCd" VARCHAR(1) NOT NULL DEFAULT 'A';

-- Add comment for the column to document status codes
COMMENT ON COLUMN "public"."bookings"."rowStatusCd" IS 'Row Status Code: A=Active, C=Completed, D=Deleted, I=Inactive, O=Obsolete';