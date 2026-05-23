import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { storeName, username, password, confirmPassword } = await request.json();

    // ── Validate required fields ──────────────────────────────────────────
    if (!storeName || !username || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    // ── Check username uniqueness globally ────────────────────────────────
    const existingUser = await prisma.userLogin.findFirst({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      );
    }

    // ── Generate a unique subdomain from username ─────────────────────────
    const baseSubdomain = username.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let subdomain = baseSubdomain;
    let attempt = 0;
    while (await prisma.tenant.findUnique({ where: { subdomain } })) {
      attempt++;
      subdomain = `${baseSubdomain}-${attempt}`;
    }

    // ── Create Tenant + UserLogin in a transaction ────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: storeName.trim(),
          subdomain,
          storeName: storeName.trim(),
          isActive: true,
          isLicensed: false,       // free tier
          signupSource: 'signup',
        },
      });

      const userLogin = await tx.userLogin.create({
        data: {
          username,
          password: hashedPassword,
          tenantId: tenant.id,
          rowStatusCd: 'A',
          updatedBy: 'System',
        },
      });

      return { tenant, userLogin };
    });

    // ── Generate JWT ───────────────────────────────────────────────────────
    const token = await generateToken({
      userId: result.userLogin.id,
      username: result.userLogin.username,
      tenantId: result.tenant.id,
      role: 'user',
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: result.userLogin.id,
        username: result.userLogin.username,
        tenantId: result.tenant.id,
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          subdomain: result.tenant.subdomain,
        },
      },
    });

    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    response.headers.set('Authorization', `Bearer ${token}`);

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
