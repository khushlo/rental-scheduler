# PowerShell script to add new configuration via migration
# Usage: .\add-config.ps1 "CONFIG_NAME" "Description of the configuration"

param(
    [Parameter(Mandatory=$true)]
    [string]$ConfigName,
    
    [Parameter(Mandatory=$true)]
    [string]$Description
)

if (-not $ConfigName -or -not $Description) {
    Write-Host "Usage: .\add-config.ps1 'CONFIG_NAME' 'Description'"
    Write-Host "Example: .\add-config.ps1 'EMAIL_NOTIFICATIONS' 'Enable/disable email notifications'"
    exit 1
}

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$migrationName = "${timestamp}_add_$($ConfigName.ToLower())_config"
$migrationDir = "prisma\migrations\$migrationName"
$migrationFile = "$migrationDir\migration.sql"

# Create migration directory
New-Item -ItemType Directory -Path $migrationDir -Force | Out-Null

# Create migration file content
$migrationContent = @"
-- Insert $ConfigName configuration only if it doesn't exist
INSERT INTO "public"."config_master" ("configName", "description", "rowStatusCd", "createdAt", "updatedAt", "modifiedBy")
SELECT '$ConfigName', '$Description', 'A', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'System'
WHERE NOT EXISTS (
    SELECT 1 FROM "public"."config_master" WHERE "configName" = '$ConfigName'
);
"@

# Write migration file
$migrationContent | Out-File -FilePath $migrationFile -Encoding UTF8

Write-Host "✅ Migration created: $migrationFile" -ForegroundColor Green
Write-Host ""
Write-Host "To apply this migration, run:" -ForegroundColor Yellow
Write-Host "1. cd `"f:\My Projects\04 Rental Scheduler\rental-scheduler`"" -ForegroundColor Cyan
Write-Host "2. npx prisma db execute --schema prisma/schema.prisma --file `"$migrationFile`"" -ForegroundColor Cyan
Write-Host "3. npx prisma migrate resolve --applied `"$migrationName`"" -ForegroundColor Cyan