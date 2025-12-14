import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check admin credentials from environment variables
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return NextResponse.json(
        { error: 'Admin credentials not configured' },
        { status: 500 }
      );
    }

    // Verify admin credentials
    if (username !== adminUsername || password !== adminPassword) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token for admin
    const token = await generateToken({
      userId: 0, // Admin user ID
      username: adminUsername,
      tenantId: 0, // Admin has access to all tenants
      role: 'admin'
    });

    // Create response with token
    const response = NextResponse.json({
      success: true,
      token: token, // Include token in response for Authorization header
      user: {
        id: 0,
        username: adminUsername,
        tenantId: 0,
        role: 'admin'
      },
    });

    // Set HTTP-only cookie for better security
    response.cookies.set({
      name: 'admin-auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}