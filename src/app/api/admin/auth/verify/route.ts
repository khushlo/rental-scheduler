import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';

function getAdminAuthTokenFromCookies(cookies: string | null): string | null {
  if (!cookies) return null;
  
  const match = cookies.match(/admin-auth-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or admin cookies
    const token = getAuthToken(request) || getAdminAuthTokenFromCookies(request.headers.get('cookie'));

    if (!token) {
      return NextResponse.json(
        { error: 'No admin token provided' },
        { status: 401 }
      );
    }

    // Verify the token
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Invalid or expired admin token' },
        { status: 401 }
      );
    }

    // Return admin user info from token
    return NextResponse.json({
      success: true,
      user: {
        id: payload.userId,
        username: payload.username,
        tenantId: payload.tenantId,
        role: payload.role,
      },
    });
  } catch (error) {
    console.error('Admin token verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}