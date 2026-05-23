import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: parseInt(tenantId) },
      select: {
        id: true,
        name: true,
        subdomain: true,
        username: true,
        storeEmail: true,
        storeName: true,
        createdAt: true,
        updatedAt: true
        // Note: password is never returned for security
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Error fetching tenant profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, name, currentPassword, newPassword, userId } = body

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 })
    }

    if (!name || name.trim().length < 1) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // ── Update display name on Tenant ────────────────────────────────────
    const updateData: any = { name: name.trim(), updatedAt: new Date() }

    // ── Password change via UserLogin ─────────────────────────────────────
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 })
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
      }

      // Find the UserLogin record for this tenant
      const userLoginWhere = userId
        ? { id: parseInt(userId), tenantId: parseInt(tenantId) }
        : { tenantId: parseInt(tenantId) }

      const userLogin = await prisma.userLogin.findFirst({ where: userLoginWhere })

      if (!userLogin) {
        return NextResponse.json({ error: 'User account not found' }, { status: 404 })
      }

      const passwordMatch = await bcrypt.compare(currentPassword, userLogin.password)
      if (!passwordMatch) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
      }

      const hashed = await bcrypt.hash(newPassword, 12)
      await prisma.userLogin.update({
        where: { id: userLogin.id },
        data: { password: hashed, updatedBy: 'Profile', updatedAt: new Date() },
      })
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: parseInt(tenantId) },
      data: updateData,
      select: {
        id: true,
        name: true,
        subdomain: true,
        username: true,
        storeEmail: true,
        storeName: true,
        updatedAt: true
        // Note: password is never returned for security
      }
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      tenant: updatedTenant
    })
  } catch (error) {
    console.error('Error updating tenant profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}