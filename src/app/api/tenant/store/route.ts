import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest, validateStoreConfig } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request)
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantContext.tenantId },
      select: {
        id: true,
        name: true,
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
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Error fetching tenant store config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request)
    const body = await request.json()

    // Validate store configuration
    const validation = validateStoreConfig(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Extract store fields from request body
    const {
      storeName,
      storeTagline,
      storeAddress,
      storePhone,
      storeEmail,
      storeWebsite,
      storeLogo,
      storeTheme,
      storeCurrency,
      storeTimezone,
      businessLicense,
      taxNumber,
      bankDetails
    } = body

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantContext.tenantId },
      data: {
        storeName,
        storeTagline,
        storeAddress,
        storePhone,
        storeEmail,
        storeWebsite,
        storeLogo,
        storeTheme,
        storeCurrency,
        storeTimezone,
        businessLicense,
        taxNumber,
        bankDetails,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
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
        bankDetails: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      message: 'Store configuration updated successfully',
      tenant: updatedTenant
    })
  } catch (error) {
    console.error('Error updating tenant store config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}