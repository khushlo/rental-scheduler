import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
        domain: true,
        settings: true,
        isActive: true,
        storeName: true,
        storeTagline: true,
        storeAddress: true,
        storePhone: true,
        storeEmail: true,
        storeWebsite: true,
        storeLogo: true,
        storeTheme: true,
        storeCurrency: true,
        storeTimezone: true,
        businessLicense: true,
        taxNumber: true,
        bankDetails: true
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Error fetching tenant config:', error)
    return NextResponse.json({ error: 'Failed to fetch tenant config' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, settings, ...otherUpdates } = body
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 })
    }

    const tenant = await prisma.tenant.update({
      where: { id: parseInt(tenantId) },
      data: {
        ...otherUpdates,
        settings: settings ? JSON.parse(JSON.stringify(settings)) : undefined
      }
    })
    
    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Tenant config update error:', error)
    return NextResponse.json({ error: 'Failed to update tenant config' }, { status: 500 })
  }
}