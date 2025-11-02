-- Insert sample configuration only if it doesn't exist
INSERT INTO "public"."config_master" ("configName", "description", "rowStatusCd", "createdAt", "updatedAt", "modifiedBy")
SELECT 'BookingNotes', 'Default notes template for new bookings', 'A', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'System'
WHERE NOT EXISTS (
    SELECT 1 FROM "public"."config_master" WHERE "configName" = 'BookingNotes'
);