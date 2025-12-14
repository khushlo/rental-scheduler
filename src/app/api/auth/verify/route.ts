import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, getAuthTokenFromCookies, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const token = getAuthToken(request) || getAuthTokenFromCookies(request.headers.get('cookie'));

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
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

    // Return user info from token
    return NextResponse.json({
      success: true,
      user: {
        id: payload.userId,
        username: payload.username,
        tenantId: payload.tenantId,
        role: payload.role || 'user', // Ensure role is included
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}