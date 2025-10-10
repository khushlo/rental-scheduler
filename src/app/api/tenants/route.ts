import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            products: true,
            customers: true,
            bookings: true
          }
        }
      }
    })
    return NextResponse.json(tenants)
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, subdomain, domain, settings } = body
    
    if (!name || !subdomain) {
      return NextResponse.json({ 
        error: 'Name and subdomain are required' 
      }, { status: 400 })
    }

    // Check if subdomain already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain }
    })

    if (existingTenant) {
      return NextResponse.json({ 
        error: 'Subdomain already exists' 
      }, { status: 409 })
    }
    
    const tenant = await prisma.tenant.create({
      data: {
        name,
        subdomain: subdomain.toLowerCase(),
        domain,
        settings: settings || {
          theme: 'light',
          currency: 'USD',
          dateFormat: 'MM/dd/yyyy',
          timeFormat: '12h',
          timezone: 'America/New_York'
        }
      }
    })
    
    return NextResponse.json(tenant, { status: 201 })
  } catch (error) {
    console.error('Tenant creation error:', error)
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id || typeof id !== 'number') {
      return NextResponse.json({ error: 'Valid tenant ID is required' }, { status: 400 })
    }
    
    const tenant = await prisma.tenant.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Tenant update error:', error)
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 })
  }
}