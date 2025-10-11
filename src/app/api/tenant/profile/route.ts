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
    const { tenantId, name, username, password } = body
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 })
    }

    if (!name || name.trim().length < 1) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if username is unique (if provided)
    if (username && username.trim()) {
      const existingUser = await prisma.tenant.findFirst({
        where: {
          username: username.trim(),
          id: {
            not: parseInt(tenantId)
          }
        }
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
      }
    }

    // Prepare update data
    const updateData: any = {
      name: name.trim(),
      updatedAt: new Date()
    }

    // Add username if provided
    if (username !== undefined) {
      updateData.username = username.trim() || null
    }

    // Hash password if provided
    if (password && password.length >= 6) {
      const saltRounds = 12
      updateData.password = await bcrypt.hash(password, saltRounds)
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