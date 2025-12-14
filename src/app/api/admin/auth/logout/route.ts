import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, getAuthTokenFromCookies, invalidateToken } from '@/lib/auth';

function getAdminAuthTokenFromCookies(cookies: string | null): string | null {
  if (!cookies) return null;
  
  const match = cookies.match(/admin-auth-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or admin cookies
    const token = getAuthToken(request) || getAdminAuthTokenFromCookies(request.headers.get('cookie'));

    if (token) {
      // Invalidate the token by adding it to the blacklist
      invalidateToken(token);
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Admin logged out successfully',
    });

    // Clear the admin auth cookie
    response.cookies.set({
      name: 'admin-auth-token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}