-- Template for adding new configurations
-- Replace [CONFIG_NAME], [DESCRIPTION] with actual values
-- Copy this file and create a new migration when adding configurations

-- Insert configuration only if it doesn't exist
INSERT INTO "public"."config_master" ("configName", "description", "rowStatusCd", "createdAt", "updatedAt", "modifiedBy")
SELECT '[CONFIG_NAME]', '[DESCRIPTION]', 'A', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'System'
WHERE NOT EXISTS (
    SELECT 1 FROM "public"."config_master" WHERE "configName" = '[CONFIG_NAME]'
);

-- Example usage:
-- 1. Copy this template
-- 2. Replace [CONFIG_NAME] with actual config name (e.g., 'EMAIL_NOTIFICATIONS')
-- 3. Replace [DESCRIPTION] with actual description (e.g., 'Enable/disable email notifications')
-- 4. Create new migration file: prisma/migrations/YYYYMMDDHHMMSS_add_[config_name]_config/migration.sql
-- 5. Run: npx prisma db execute --schema prisma/schema.prisma --file [migration_file_path]
-- 6. Run: npx prisma migrate resolve --applied [migration_name]