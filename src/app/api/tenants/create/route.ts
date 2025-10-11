import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_STORE_CONFIG, validateStoreConfig } from '@/lib/tenant'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      subdomain,
      domain,
      storeName,
      storeTagline,
      storeAddress,
      storePhone,
      storeEmail,
      storeWebsite,
      storeTheme = 'light',
      storeCurrency = 'USD',
      storeTimezone = 'America/New_York',
      businessLicense,
      taxNumber,
      settings
    } = body

    // Validate required fields
    if (!name || !subdomain) {
      return NextResponse.json(
        { error: 'Name and subdomain are required' },
        { status: 400 }
      )
    }

    // Validate store configuration if provided
    const storeConfig = {
      storeName: storeName || DEFAULT_STORE_CONFIG.storeName,
      storeEmail,
      storeWebsite
    }
    
    const validation = validateStoreConfig(storeConfig)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Store validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Check if subdomain already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain }
    })

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Subdomain already exists' },
        { status: 409 }
      )
    }

    // Create new tenant with store information
    const newTenant = await prisma.tenant.create({
      data: {
        name,
        subdomain,
        domain,
        settings: settings ? JSON.parse(JSON.stringify(settings)) : null,
        isActive: true,
        storeName: storeName || DEFAULT_STORE_CONFIG.storeName,
        storeTagline: storeTagline || DEFAULT_STORE_CONFIG.storeTagline,
        storeAddress: storeAddress || DEFAULT_STORE_CONFIG.storeAddress,
        storePhone: storePhone || DEFAULT_STORE_CONFIG.storePhone,
        storeEmail: storeEmail || DEFAULT_STORE_CONFIG.storeEmail,
        storeWebsite: storeWebsite || DEFAULT_STORE_CONFIG.storeWebsite,
        storeTheme,
        storeCurrency,
        storeTimezone,
        businessLicense,
        taxNumber
      }
    })

    return NextResponse.json({
      message: 'Tenant created successfully',
      tenant: newTenant
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    )
  }
}