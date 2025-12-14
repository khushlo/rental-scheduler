import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getTenantFromRequest } from '@/lib/tenant'
import { verifyToken, getAuthTokenFromCookies } from '@/lib/auth'

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/logout',
  '/login',
  '/signup',
  '/',
]

const ADMIN_PUBLIC_PATHS = [
  '/admin/login',
  '/api/admin/auth/login',
  '/api/admin/auth/logout',
]

const API_PATHS_NO_AUTH = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/admin/auth/login',
  '/api/admin/auth/logout',
  '/api/admin/auth/verify',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path))
}

function isAdminPublicPath(pathname: string): boolean {
  return ADMIN_PUBLIC_PATHS.some(path => pathname === path)
}

function isApiPathNoAuth(pathname: string): boolean {
  return API_PATHS_NO_AUTH.some(path => pathname === path)
}

function getAdminAuthTokenFromCookies(cookies: string | null): string | null {
  if (!cookies) return null;
  const match = cookies.match(/admin-auth-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function middleware(request: NextRequest) {
  // Skip middleware for static files
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.startsWith('/static')
  ) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  
  // Handle API routes first
  if (pathname.startsWith('/api')) {
    // Admin API routes
    if (pathname.startsWith('/api/admin')) {
      // Skip auth for specific admin API routes
      if (isApiPathNoAuth(pathname)) {
        return NextResponse.next()
      }

      // Check both cookie and Authorization header for admin token
      const adminTokenFromCookie = getAdminAuthTokenFromCookies(request.headers.get('cookie'))
      const authHeader = request.headers.get('authorization')
      const adminTokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
      
      const adminToken = adminTokenFromHeader || adminTokenFromCookie
      const isAdminAuthenticated = adminToken ? await verifyToken(adminToken) : null
      const isAdminWithRole = isAdminAuthenticated && isAdminAuthenticated.role === 'admin'

      if (!isAdminWithRole) {
        return NextResponse.json(
          { error: 'Admin authentication required' },
          { status: 401 }
        )
      }

      return NextResponse.next()
    }

    // Regular API routes
    const tenantContext = getTenantFromRequest(request)
    
    // Skip auth for specific API routes
    if (isApiPathNoAuth(pathname)) {
      const response = NextResponse.next()
      response.headers.set('X-Tenant-ID', tenantContext.tenantId.toString())
      response.headers.set('X-Tenant-Subdomain', tenantContext.subdomain)
      return response
    }

    // Check authentication for regular protected routes
    const token = getAuthTokenFromCookies(request.headers.get('cookie'))
    const isAuthenticated = token ? await verifyToken(token) : null
    const isRegularUser = isAuthenticated && isAuthenticated.role === 'user'

    // Require regular user authentication for regular API routes
    if (!isRegularUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Add tenant and user context to headers for API routes
    const response = NextResponse.next()
    response.headers.set('X-Tenant-ID', tenantContext.tenantId.toString())
    response.headers.set('X-Tenant-Subdomain', tenantContext.subdomain)
    response.headers.set('X-User-ID', isAuthenticated.userId.toString())
    response.headers.set('X-Username', isAuthenticated.username)
    return response
  }

  // Handle admin page routes (non-API)
  if (pathname.startsWith('/admin')) {
    // Check both cookie and Authorization header for admin token
    const adminTokenFromCookie = getAdminAuthTokenFromCookies(request.headers.get('cookie'))
    const authHeader = request.headers.get('authorization')
    const adminTokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    
    const adminToken = adminTokenFromHeader || adminTokenFromCookie
    const isAdminAuthenticated = adminToken ? await verifyToken(adminToken) : null
    const isAdminWithRole = isAdminAuthenticated && isAdminAuthenticated.role === 'admin'

    // Admin page routes
    if (!isAdminWithRole && !isAdminPublicPath(pathname)) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    if (isAdminWithRole && pathname === '/admin/login') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }

    return NextResponse.next()
  }
  
  // Get tenant context for regular routes
  const tenantContext = getTenantFromRequest(request)

  // Check authentication for regular protected routes
  const token = getAuthTokenFromCookies(request.headers.get('cookie'))
  const isAuthenticated = token ? await verifyToken(token) : null
  const isRegularUser = isAuthenticated && isAuthenticated.role === 'user'

  // Handle regular page routes
  if (!isRegularUser && !isPublicPath(pathname)) {
    // Redirect to login if not authenticated and not on public path
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isRegularUser && pathname === '/login') {
    // Redirect to dashboard if already authenticated and trying to access login
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Add context headers for page routes
  const response = NextResponse.next()
  response.headers.set('X-Tenant-ID', tenantContext.tenantId.toString())
  response.headers.set('X-Tenant-Subdomain', tenantContext.subdomain)
  
  if (isRegularUser) {
    response.headers.set('X-User-ID', isAuthenticated.userId.toString())
    response.headers.set('X-Username', isAuthenticated.username)
  }
  
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