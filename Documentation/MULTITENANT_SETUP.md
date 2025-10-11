# Multi-Tenant Architecture Documentation

This document outlines the multi-tenant architecture implementation for the Rental Scheduler application.

## Overview

The application supports multiple tenants (organizations) sharing the same codebase and database while keeping their data completely isolated.

## Architecture

### Database Schema

1. **`tenants` table**: Stores tenant information
2. **tenantId columns**: Added to all main tables (products, customers, bookings)
3. **Default tenant**: ID 1 ("Default Organization") for existing data

### Tenant Isolation

- All API routes are tenant-aware
- Data is filtered by tenant ID automatically
- No cross-tenant data access possible

## Multi-Tenant Features

### Tenant Management API

#### Get All Tenants
```bash
GET /api/tenants
```

#### Create New Tenant
```bash
POST /api/tenants
Content-Type: application/json

{
  "name": "New Organization",
  "subdomain": "neworg",
  "domain": "neworg.com",
  "settings": {
    "theme": "dark",
    "currency": "EUR"
  }
}
```

#### Update Tenant Configuration
```bash
PUT /api/tenant/config
Content-Type: application/json

{
  "tenantId": 1,
  "settings": {
    "theme": "light",
    "currency": "USD"
  }
}
```

### Tenant Context

The application determines the current tenant using multiple methods:

1. **Header-based**: `X-Tenant-ID` header
2. **Subdomain-based**: `tenant1.yourapp.com`
3. **URL path-based**: `/tenant/123/dashboard`
4. **Default**: Falls back to tenant 1 for localhost

### API Changes

All existing API routes now:
- Filter data by tenant ID
- Automatically associate new records with the current tenant
- Prevent cross-tenant data access

Example:
```javascript
// Before: Returns all customers
GET /api/customers

// After: Returns only customers for the current tenant
GET /api/customers
```

## Development Guidelines

### Creating Tenant-Aware Components

```typescript
import { getTenantFromRequest } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  const tenantContext = getTenantFromRequest(request)
  
  const data = await prisma.model.findMany({
    where: {
      tenantId: tenantContext.tenantId
    }
  })
  
  return NextResponse.json(data)
}
```

### Adding New Models

When adding new models, remember to:
1. Add `tenantId` field with default value
2. Add tenant relationship
3. Update API routes to be tenant-aware
4. Add to tenant utility functions

Example:
```prisma
model NewModel {
  id       Int    @id @default(autoincrement())
  name     String
  tenantId Int    @default(1)
  
  tenant   Tenant @relation(fields: [tenantId], references: [id])
  
  @@map("new_models")
}
```

## Tenant Settings

Each tenant can have custom settings stored as JSON:

```typescript
interface TenantSettings {
  theme: 'light' | 'dark'
  currency: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  timezone: string
  features: {
    enableReports: boolean
    enableCalendar: boolean
    enableAdvancedBooking: boolean
  }
}
```

## Security Considerations

1. **Data Isolation**: All queries are filtered by tenant ID
2. **Tenant Validation**: Middleware validates tenant access
3. **No Cross-Tenant Access**: Users cannot access other tenants' data
4. **Secure Defaults**: All new records use the current tenant context

## Testing Multi-Tenancy

### Test Scenarios

1. **Data Isolation**: Ensure tenant A cannot see tenant B's data
2. **API Filtering**: All endpoints filter by tenant
3. **Tenant Creation**: New tenants can be created and configured
4. **Default Behavior**: Existing functionality works with default tenant

### Test Commands

```bash
# Run with specific tenant ID
curl -H "X-Tenant-ID: 1" http://localhost:3000/api/customers

# Create new tenant
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"Test Org","subdomain":"test"}' \
  http://localhost:3000/api/tenants
```

## Monitoring and Maintenance

1. **Database Size**: Monitor tenant data growth
2. **Performance**: Index on tenantId columns for better performance
3. **Backups**: Tenant-specific backup strategies
4. **Cleanup**: Archive inactive tenants

## Future Enhancements

1. **Tenant-specific Subdomains**: Automatic subdomain routing
2. **White-label Branding**: Per-tenant UI customization
3. **Usage Analytics**: Per-tenant usage metrics
4. **Billing Integration**: Tenant-based billing
5. **Data Export**: Tenant data export functionality

## Troubleshooting

### Common Issues

1. **Foreign Key Errors**: Ensure all related records have the same tenantId
2. **Missing Data**: Check if correct tenant context is being used
3. **Migration Failures**: Verify database backup before retrying

### Debug Commands

```bash
# Check tenant data distribution
npm run db:studio

# Verify migration status
npx prisma migrate status

# Reset if needed (CAUTION: Will lose data)
npm run db:reset
```