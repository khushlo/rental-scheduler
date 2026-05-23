-- AddColumn: isLicensed and signupSource to tenants
-- Safe: additive only, existing rows get defaults (false / 'admin')
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "is_licensed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "signup_source" VARCHAR(20) DEFAULT 'admin';
