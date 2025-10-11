# Enhanced Multi-Tenant Store System

## Overview

The rental scheduler application has been enhanced with comprehensive store management capabilities for multi-tenant architecture. Each tenant can now have their own complete store configuration instead of relying on global environment variables.

## What Was Added

### Database Schema Enhancements

The `Tenant` model has been extended with the following store-related fields:

```prisma
model Tenant {
  // ... existing fields
  
  // Store-related fields for multi-tenant store management
  storeName     String?
  storeTagline  String?
  storeAddress  String?
  storePhone    String?
  storeEmail    String?
  storeWebsite  String?
  storeLogo     String?
  storeTheme    String?   @default("light")
  storeCurrency String?   @default("USD")
  storeTimezone String?   @default("America/New_York")
  
  // Business details
  businessLicense String?
  taxNumber       String?
  bankDetails     Json?
}
```

### Key Features

1. **Tenant-Specific Store Information**: Each tenant can have their own store name, tagline, address, contact details, and branding.

2. **Business Details**: Support for business license, tax numbers, and bank details.

3. **Store Configuration Management**: RESTful API endpoints for managing store settings.

4. **Invoice Integration**: Invoices now use tenant-specific store information instead of global environment variables.

5. **Settings UI**: A comprehensive form for managing store configuration.

## API Endpoints

### Get Tenant Store Configuration
```http
GET /api/tenant/config?tenantId=1
```

### Update Tenant Store Configuration
```http
PUT /api/tenant/config
Content-Type: application/json

{
  "tenantId": 1,
  "storeName": "My Rental Store",
  "storeTagline": "Professional Equipment Rental",
  "storeAddress": "123 Business Street, City, State 12345",
  "storePhone": "+1 (555) 123-4567",
  "storeEmail": "info@mystore.com",
  "storeWebsite": "https://mystore.com",
  "storeCurrency": "USD",
  "storeTheme": "light",
  "businessLicense": "BL123456",
  "taxNumber": "TAX123456"
}
```

### Create New Tenant with Store Information
```http
POST /api/tenants/create
Content-Type: application/json

{
  "name": "New Organization",
  "subdomain": "neworg",
  "storeName": "New Rental Business",
  "storeTagline": "Quality Equipment Rentals",
  "storeAddress": "456 Commerce Ave, Business City, State 67890",
  "storePhone": "+1 (555) 987-6543",
  "storeEmail": "contact@neworg.com",
  "storeWebsite": "https://neworg.com",
  "storeCurrency": "USD"
}
```

## UI Components

### Store Settings Page
- Navigate to `/settings/store` to access the store configuration form
- Edit all store-related information in a user-friendly interface
- Real-time validation and error handling
- Responsive design for all device sizes

### Navigation Updates
- Added "Store Settings" link to the main navigation
- Uses the Settings icon from Lucide React

## Invoice System Integration

The invoice generation system has been updated to use tenant-specific store information:

```typescript
// Before: Used global environment variables
const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Default Store';

// After: Uses tenant-specific store information with fallback
const storeName = tenant?.storeName || process.env.NEXT_PUBLIC_STORE_NAME || 'Default Store';
```

### Invoice Data Flow
1. Booking API now includes tenant store information when fetching individual bookings
2. Invoice generation functions accept tenant data as a parameter
3. PDF and HTML invoice templates use tenant-specific store details
4. Fallback to environment variables ensures backward compatibility

## Migration and Data Preservation

### Safe Migration Process
1. Used `npx prisma db push` to apply schema changes without data loss
2. Created a migration script to populate existing tenant with environment variable data
3. All existing data remains intact and functional

### Default Tenant Update
The default tenant (ID: 1) has been populated with store information from the existing environment variables:

```typescript
// Updated default tenant with current .env values
storeName: "Adiman Art"
storeTagline: "A customized wedding store"
storeAddress: "123 Wedding Street, Art District, City 123456"
storePhone: "+91 9876543210"
storeEmail: "info@adimanart.com"
storeCurrency: "INR"
storeTimezone: "Asia/Kolkata"
```

## Validation and Security

### Store Configuration Validation
- Store name must be at least 2 characters
- Email validation for store email addresses
- URL validation for store websites
- Required field validation

### Security Features
- Tenant-aware API endpoints
- Input sanitization and validation
- Error handling and appropriate HTTP status codes
- Type-safe data structures

## Utility Functions

### New Helper Functions
```typescript
// Get tenant store configuration with defaults
getTenantStoreConfig(tenant: any)

// Validate store configuration
validateStoreConfig(storeConfig: any)

// Default store configuration for new tenants
DEFAULT_STORE_CONFIG
```

## Usage Examples

### Creating a New Tenant with Store Info
```typescript
const newTenant = {
  name: "Premium Rentals",
  subdomain: "premium",
  storeName: "Premium Equipment Rentals",
  storeTagline: "High-End Equipment for Special Events",
  storeAddress: "789 Premium Blvd, Luxury City, State 11111",
  storePhone: "+1 (555) 111-2222",
  storeEmail: "info@premiumrentals.com",
  storeCurrency: "USD"
};

const response = await fetch('/api/tenants/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newTenant)
});
```

### Updating Store Configuration
```typescript
const storeUpdate = {
  tenantId: 1,
  storeName: "Updated Store Name",
  storeTagline: "New and Improved Tagline",
  storeTheme: "dark"
};

const response = await fetch('/api/tenant/config', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(storeUpdate)
});
```

## Benefits

1. **True Multi-Tenancy**: Each tenant can have completely customized store branding and information
2. **Scalability**: No limit on the number of tenants, each with unique store configurations
3. **Professional Invoices**: Each tenant's invoices reflect their specific business information
4. **Easy Management**: Intuitive UI for managing store settings
5. **Data Integrity**: All existing data preserved during the enhancement
6. **Backward Compatibility**: System works with existing tenants using environment variable fallbacks

## Next Steps

1. **Logo Upload**: Implement file upload functionality for store logos
2. **Theme Customization**: Expand theme options with custom colors and fonts
3. **Email Templates**: Create tenant-specific email templates
4. **Multi-Currency Support**: Implement currency conversion and formatting
5. **Analytics**: Add tenant-specific analytics and reporting
6. **Backup and Export**: Tenant-specific data export functionality

## Troubleshooting

### Common Issues
1. **TypeScript Errors**: The Prisma client may need regeneration after schema changes
2. **Missing Store Data**: Check if tenant has store information configured
3. **Invoice Generation**: Ensure booking API includes tenant information

### Debug Commands
```bash
# Regenerate Prisma client
npx prisma generate

# Check tenant store configuration
curl -H "X-Tenant-ID: 1" http://localhost:3000/api/tenant/config?tenantId=1

# Update tenant store info
curl -X PUT -H "Content-Type: application/json" \
  -d '{"tenantId":1,"storeName":"Test Store"}' \
  http://localhost:3000/api/tenant/config
```

This enhancement provides a solid foundation for true multi-tenant store management while maintaining all existing functionality and data.