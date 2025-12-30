import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, getAuthTokenFromCookies, verifyToken, JWTPayload } from '@/lib/auth';

export interface AuthenticatedUser {
  id: number;
  username: string;
  tenantId: number;
  role: 'user' | 'admin';
}

export type ApiAuthResult = {
  success: true;
  user: AuthenticatedUser;
} | {
  success: false;
  response: NextResponse;
}

/**
 * Common authentication middleware for API routes
 * Returns either the authenticated user or an error response
 */
export async function authenticateApiRequest(request: NextRequest): Promise<ApiAuthResult> {
  try {
    // Get token from Authorization header or cookies
    const token = getAuthToken(request) || getAuthTokenFromCookies(request.headers.get('cookie'));

    if (!token) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      };
    }

    // Verify the token and get user info
    const payload = await verifyToken(token);

    if (!payload) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      };
    }

    // Return authenticated user
    return {
      success: true,
      user: {
        id: payload.userId,
        username: payload.username,
        tenantId: payload.tenantId,
        role: payload.role
      }
    };
  } catch (error) {
    console.error('API authentication error:', error);
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    };
  }
}

/**
 * Wrapper function for API routes that require authentication
 * Usage: 
 * export async function GET(request: NextRequest) {
 *   return withAuth(request, async (user) => {
 *     // Your authenticated route logic here
 *     // user.tenantId is available
 *     return NextResponse.json({...});
 *   });
 * }
 */
export async function withAuth(
  request: NextRequest,
  handler: (user: AuthenticatedUser, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const authResult = await authenticateApiRequest(request);
  
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    return await handler(authResult.user, request);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if user has permission to access tenant data
 */
export function hasAccessToTenant(userTenantId: number, requestedTenantId: number): boolean {
  return userTenantId === requestedTenantId;
}

/**
 * Middleware for admin-only routes
 */
export async function withAdminAuth(
  request: NextRequest,
  handler: (user: AuthenticatedUser, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, async (user, req) => {
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    return handler(user, req);
  });
}