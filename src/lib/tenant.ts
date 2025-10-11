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
 * Default tenant settings including store configuration
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
 * Default store configuration for new tenants
 */
export const DEFAULT_STORE_CONFIG = {
  storeName: 'Rental Equipment & Services',
  storeTagline: 'Professional Equipment Rental',
  storeAddress: 'Your Store Address',
  storePhone: 'Your Phone Number',
  storeEmail: 'info@yourstore.com',
  storeWebsite: 'https://yourstore.com',
  storeTheme: 'light',
  storeCurrency: 'USD',
  storeTimezone: 'America/New_York'
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
          username: true,
          settings: true,
          storeName: true,
          storeTagline: true,
          storeAddress: true,
          storePhone: true,
          storeEmail: true,
          storeWebsite: true,
          storeLogo: true,
          storeTheme: true,
          storeCurrency: true,
          storeTimezone: true
        }
      }
    }
  }
}

/**
 * Get tenant store configuration
 */
export function getTenantStoreConfig(tenant: any) {
  return {
    storeName: tenant?.storeName || DEFAULT_STORE_CONFIG.storeName,
    storeTagline: tenant?.storeTagline || DEFAULT_STORE_CONFIG.storeTagline,
    storeAddress: tenant?.storeAddress || DEFAULT_STORE_CONFIG.storeAddress,
    storePhone: tenant?.storePhone || DEFAULT_STORE_CONFIG.storePhone,
    storeEmail: tenant?.storeEmail || DEFAULT_STORE_CONFIG.storeEmail,
    storeWebsite: tenant?.storeWebsite || DEFAULT_STORE_CONFIG.storeWebsite,
    storeLogo: tenant?.storeLogo,
    storeTheme: tenant?.storeTheme || DEFAULT_STORE_CONFIG.storeTheme,
    storeCurrency: tenant?.storeCurrency || DEFAULT_STORE_CONFIG.storeCurrency,
    storeTimezone: tenant?.storeTimezone || DEFAULT_STORE_CONFIG.storeTimezone
  }
}

/**
 * Validate store configuration
 */
export function validateStoreConfig(storeConfig: any) {
  const errors: string[] = []
  
  if (!storeConfig.storeName || storeConfig.storeName.trim().length < 2) {
    errors.push('Store name must be at least 2 characters long')
  }
  
  if (storeConfig.storeEmail && !isValidEmail(storeConfig.storeEmail)) {
    errors.push('Store email must be a valid email address')
  }
  
  if (storeConfig.storeWebsite && !isValidUrl(storeConfig.storeWebsite)) {
    errors.push('Store website must be a valid URL')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}