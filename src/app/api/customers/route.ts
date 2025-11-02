import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CustomerSchema } from '@/lib/validations'
import { calculateBookingStatus } from '@/lib/utils'
import { getTenantFromRequest } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request)
    
    const customers = await prisma.customer.findMany({
      where: {
        tenantId: tenantContext.tenantId
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    })
    return NextResponse.json(customers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request)
    const body = await request.json()
    const validatedData = CustomerSchema.parse(body)
    
    const customer = await prisma.customer.create({
      data: {
        ...validatedData,
        tenantId: tenantContext.tenantId
      }
    })
    
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Customer creation error:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request)
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id || typeof id !== 'number') {
      return NextResponse.json({ error: 'Valid customer ID is required' }, { status: 400 })
    }
    
    const validatedData = CustomerSchema.omit({ id: true }).parse(updateData)
    
    const customer = await prisma.customer.update({
      where: { 
        id,
        tenantId: tenantContext.tenantId
      },
      data: validatedData
    })
    
    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Customer update error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email address already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'Valid customer ID is required' }, { status: 400 })
    }
    
    const customerId = parseInt(id, 10)
    
    // Check if customer has any active bookings
    const allBookings = await prisma.booking.findMany({
      where: {
        customerId
      }
    })
    
    // Filter to only active bookings (confirmed or active status)
    const activeBookings = allBookings.filter(booking => {
      const status = calculateBookingStatus(booking.startDate, booking.endDate, undefined, booking.rowStatusCd)
      return status === 'confirmed' || status === 'active'
    })
    
    if (activeBookings.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete customer with active bookings',
        details: `Customer has ${activeBookings.length} active booking(s). Please complete or cancel all bookings before deleting the customer.`,
        activeBookingsCount: activeBookings.length,
        canDelete: false
      }, { status: 409 })
    }
    
    await prisma.customer.delete({
      where: { id: customerId }
    })
    
    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error: any) {
    console.error('Customer deletion error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}