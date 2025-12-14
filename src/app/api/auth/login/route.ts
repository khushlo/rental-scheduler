import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password, tenantId } = await request.json();

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user by username and tenant
    const user = await prisma.userLogin.findUnique({
      where: {
        username_tenantId: {
          username,
          tenantId: tenantId || 1, // Default to tenant 1 if not provided
        },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.rowStatusCd !== 'A') {
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 401 }
      );
    }

    // Check if tenant is active
    if (!user.tenant.isActive) {
      return NextResponse.json(
        { error: 'Tenant account is inactive' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await generateToken({
      userId: user.id,
      username: user.username,
      tenantId: user.tenantId,
      role: 'user'
    });

    // Create response with token
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        tenantId: user.tenantId,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          subdomain: user.tenant.subdomain,
        },
      },
    });

    // Set HTTP-only cookie for better security
    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    // Also send token in response for client-side storage if needed
    response.headers.set('Authorization', `Bearer ${token}`);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}