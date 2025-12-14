import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, getAuthTokenFromCookies, verifyToken, hasAccessToTenant } from '@/lib/auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: number;
    username: string;
    tenantId: number;
  };
}

export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse> | NextResponse,
  options?: {
    requireTenantAccess?: number; // Require access to specific tenant
    allowedRoles?: string[]; // Future: role-based access
  }
): Promise<NextResponse> {
  try {
    // Get token from Authorization header or cookies
    const token = getAuthToken(request) || getAuthTokenFromCookies(request.headers.get('cookie'));

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the token
    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check tenant access if required
    if (options?.requireTenantAccess && !hasAccessToTenant(payload.tenantId, options.requireTenantAccess)) {
      return NextResponse.json(
        { error: 'Access denied to this tenant' },
        { status: 403 }
      );
    }

    // Add user info to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = {
      id: payload.userId,
      username: payload.username,
      tenantId: payload.tenantId,
    };

    // Call the handler
    return await handler(authenticatedRequest);
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

// Helper function to get user from request (for use in API routes)
export async function getCurrentUser(request: NextRequest) {
  const token = getAuthToken(request) || getAuthTokenFromCookies(request.headers.get('cookie'));
  
  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  
  if (!payload) {
    return null;
  }

  return {
    id: payload.userId,
    username: payload.username,
    tenantId: payload.tenantId,
  };
}

// Helper to check if user is authenticated
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const user = await getCurrentUser(request);
  return user !== null;
}