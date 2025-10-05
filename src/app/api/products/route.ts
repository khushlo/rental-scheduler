import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ProductSchema } from '@/lib/validations'
import { calculateBookingStatus } from '@/lib/utils'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { bookingItems: true }
        }
      }
    })
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Manually validate the required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
    }
    if (typeof body.quantity !== 'number' || body.quantity < 0) {
      return NextResponse.json({ error: 'Valid quantity is required' }, { status: 400 })
    }
    if (typeof body.rentPrice !== 'number' || body.rentPrice < 0) {
      return NextResponse.json({ error: 'Valid rent price is required' }, { status: 400 })
    }
    if (typeof body.status !== 'boolean') {
      return NextResponse.json({ error: 'Status must be boolean' }, { status: 400 })
    }
    
    const product = await prisma.product.create({
      data: {
        name: body.name,
        quantity: body.quantity,
        rentPrice: body.rentPrice,
        status: body.status,
      }
    })
    
    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error('Product creation error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const validatedData = ProductSchema.parse(updateData)
    
    const product = await prisma.product.update({
      where: { id: parseInt(id.toString(), 10) },
      data: validatedData
    })
    
    return NextResponse.json(product)
  } catch (error) {
    console.error('Product update error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const productId = parseInt(id, 10)
    
    // Check if product has active bookings
    // Get all bookings for this product, then filter by calculated status
    const allBookings = await prisma.booking.findMany({
      where: {
        items: {
          some: {
            productId: productId
          }
        }
      },
      include: {
        customer: {
          select: { name: true }
        }
      }
    })

    // Filter to only active/confirmed bookings using calculated status
    const activeBookings = allBookings.filter(booking => {
      const status = calculateBookingStatus(booking.startDate, booking.endDate)
      return status === 'confirmed' || status === 'active'
    })

    if (activeBookings.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete product with active or confirmed bookings',
        activeBookings: activeBookings.map(booking => ({
          id: booking.id,
          customerName: booking.customer.name,
          status: calculateBookingStatus(booking.startDate, booking.endDate),
          startDate: booking.startDate,
          endDate: booking.endDate
        }))
      }, { status: 400 })
    }
    
    await prisma.product.delete({
      where: { id: productId }
    })
    
    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Product deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}