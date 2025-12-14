import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

function getAdminAuthTokenFromCookies(cookies: string | null): string | null {
  if (!cookies) return null;
  
  const match = cookies.match(/admin-auth-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function verifyAdminAccess(request: NextRequest) {
  const token = getAdminAuthTokenFromCookies(request.headers.get('cookie'));
  
  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  
  if (!payload || payload.role !== 'admin') {
    return null;
  }

  return payload;
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const adminUser = await verifyAdminAccess(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    const { username, password, tenantId, updatedBy } = await request.json();

    // Validate required fields
    if (!username || !password || !tenantId) {
      return NextResponse.json(
        { error: 'Username, password, and tenantId are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.userLogin.findUnique({
      where: {
        username_tenantId: {
          username,
          tenantId: parseInt(tenantId),
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this username for this tenant' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.userLogin.create({
      data: {
        username,
        password: hashedPassword,
        tenantId: parseInt(tenantId),
        rowStatusCd: 'A',
        updatedBy: updatedBy || adminUser.username,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const adminUser = await verifyAdminAccess(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    // Build where clause
    const where: any = {
      rowStatusCd: 'A', // Only active users
    };

    if (tenantId) {
      where.tenantId = parseInt(tenantId);
    }

    // Fetch users
    const users = await prisma.userLogin.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    return NextResponse.json({
      success: true,
      users: usersWithoutPasswords,
    });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}