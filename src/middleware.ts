import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getTenantFromRequest } from '@/lib/tenant'

export function middleware(request: NextRequest) {
  // Skip middleware for static files, API routes that don't need tenant context
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.startsWith('/static')
  ) {
    return NextResponse.next()
  }

  // Get tenant context
  const tenantContext = getTenantFromRequest(request)
  
  // Add tenant context to headers for API routes
  const response = NextResponse.next()
  response.headers.set('X-Tenant-ID', tenantContext.tenantId.toString())
  response.headers.set('X-Tenant-Subdomain', tenantContext.subdomain)
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}