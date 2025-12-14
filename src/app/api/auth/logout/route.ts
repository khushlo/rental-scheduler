import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, getAuthTokenFromCookies, invalidateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const token = getAuthToken(request) || getAuthTokenFromCookies(request.headers.get('cookie'));

    if (token) {
      // Invalidate the token by adding it to the blacklist
      invalidateToken(token);
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear the auth cookie
    response.cookies.set({
      name: 'auth-token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET for logout via URL
export async function GET(request: NextRequest) {
  return POST(request);
}