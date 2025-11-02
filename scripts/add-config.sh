#!/bin/bash
# Script to add new configuration via migration
# Usage: ./add-config.sh "CONFIG_NAME" "Description of the configuration"

if [ $# -ne 2 ]; then
    echo "Usage: $0 'CONFIG_NAME' 'Description'"
    echo "Example: $0 'EMAIL_NOTIFICATIONS' 'Enable/disable email notifications'"
    exit 1
fi

CONFIG_NAME="$1"
DESCRIPTION="$2"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_NAME="${TIMESTAMP}_add_${CONFIG_NAME,,}_config"
MIGRATION_DIR="prisma/migrations/${MIGRATION_NAME}"
MIGRATION_FILE="${MIGRATION_DIR}/migration.sql"

# Create migration directory
mkdir -p "$MIGRATION_DIR"

# Create migration file from template
cat > "$MIGRATION_FILE" << EOF
-- Insert ${CONFIG_NAME} configuration only if it doesn't exist
INSERT INTO "public"."config_master" ("configName", "description", "rowStatusCd", "createdAt", "updatedAt", "modifiedBy")
SELECT '${CONFIG_NAME}', '${DESCRIPTION}', 'A', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'System'
WHERE NOT EXISTS (
    SELECT 1 FROM "public"."config_master" WHERE "configName" = '${CONFIG_NAME}'
);
EOF

echo "✅ Migration created: ${MIGRATION_FILE}"
echo ""
echo "To apply this migration, run:"
echo "1. cd \"f:\\My Projects\\04 Rental Scheduler\\rental-scheduler\""
echo "2. npx prisma db execute --schema prisma/schema.prisma --file \"${MIGRATION_FILE}\""
echo "3. npx prisma migrate resolve --applied \"${MIGRATION_NAME}\""