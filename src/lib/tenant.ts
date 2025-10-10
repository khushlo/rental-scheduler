import { NextRequest } from 'next/server'

export interface TenantContext {
  tenantId: number
  subdomain: string
}

/**
 * Extract tenant information from request
 * This can be enhanced to work with:
 * 1. Subdomain-based multi-tenancy (e.g., tenant1.yourapp.com)
 * 2. Header-based tenant identification
 * 3. URL path-based tenancy (e.g., /tenant/123/dashboard)
 */
export function getTenantFromRequest(request: NextRequest): TenantContext {
  // Method 1: Check for X-Tenant-ID header
  const tenantIdHeader = request.headers.get('X-Tenant-ID')
  if (tenantIdHeader) {
    return {
      tenantId: parseInt(tenantIdHeader),
      subdomain: 'header-based'
    }
  }

  // Method 2: Extract from subdomain
  const host = request.headers.get('host') || ''
  const subdomain = host.split('.')[0]
  
  // For development, default to tenant 1
  if (subdomain === 'localhost' || host.includes('localhost')) {
    return {
      tenantId: 1,
      subdomain: 'default'
    }
  }

  // Method 3: Check URL path for tenant ID
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/')
  const tenantIndex = pathSegments.findIndex(segment => segment === 'tenant')
  
  if (tenantIndex !== -1 && pathSegments[tenantIndex + 1]) {
    const tenantId = parseInt(pathSegments[tenantIndex + 1])
    if (!isNaN(tenantId)) {
      return {
        tenantId,
        subdomain: `tenant-${tenantId}`
      }
    }
  }

  // Default to tenant 1 for existing installations
  return {
    tenantId: 1,
    subdomain: 'default'
  }
}

/**
 * Middleware function to add tenant context to API responses
 */
export function withTenantContext<T>(data: T, tenantContext: TenantContext) {
  return {
    ...data,
    _tenant: tenantContext
  }
}

/**
 * Default tenant settings
 */
export const DEFAULT_TENANT_SETTINGS = {
  theme: 'light',
  currency: 'USD',
  dateFormat: 'MM/dd/yyyy',
  timeFormat: '12h',
  timezone: 'America/New_York',
  features: {
    enableReports: true,
    enableCalendar: true,
    enableAdvancedBooking: true
  }
}

/**
 * Tenant-aware Prisma query helper
 */
export function tenantQuery(tenantId: number) {
  return {
    where: {
      tenantId: tenantId
    }
  }
}

export function tenantInclude(tenantId: number) {
  return {
    ...tenantQuery(tenantId),
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          subdomain: true,
          settings: true
        }
      }
    }
  }
}