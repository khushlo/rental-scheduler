import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateBookingStatus } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const quantity = searchParams.get('quantity')

    if (!productId || !startDate || !endDate) {
      return NextResponse.json({ error: 'productId, startDate, and endDate are required' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const requestedQuantity = quantity ? parseInt(quantity) : 1
    const numericProductId = parseInt(productId, 10)

    if (isNaN(numericProductId) || numericProductId <= 0) {
      return NextResponse.json({ error: 'Invalid productId' }, { status: 400 })
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    if (start >= end) {
      return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 })
    }

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: numericProductId },
      select: { id: true, name: true, quantity: true, status: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!product.status) {
      return NextResponse.json({
        available: false,
        reason: 'Product is inactive',
        product,
        availableQuantity: 0,
        totalquantity: product.quantity
      })
    }

    // Check overlapping bookings (exclude completed and cancelled bookings)
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        items: {
          some: {
            productId: numericProductId
          }
        },
        AND: [
          {
            startDate: {
              lte: end,
            }
          },
          {
            endDate: {
              gte: start,
            }
          }
        ]
      },
      include: {
        items: {
          where: {
            productId: numericProductId
          }
        },
        customer: {
          select: { name: true, phone1: true }
        }
      },
      orderBy: { startDate: 'asc' }
    })

    // Calculate booked quantity from non-completed/non-cancelled bookings
    const bookedQuantity = overlappingBookings.reduce((total, booking) => {
      const status = calculateBookingStatus(booking.startDate, booking.endDate)
      // Only count bookings that are confirmed or active
      if (status === 'confirmed' || status === 'active') {
        return total + booking.items.reduce((itemTotal: number, bookingItem: any) => {
          return itemTotal + bookingItem.quantity
        }, 0)
      }
      return total
    }, 0)

    const availableQuantity = product.quantity - bookedQuantity
    const isAvailable = availableQuantity >= requestedQuantity

    return NextResponse.json({
      available: isAvailable,
      product,
      requestedQuantity,
      availableQuantity,
      totalquantity: product.quantity,
      bookedQuantity,
      conflictingBookings: overlappingBookings
        .filter(booking => {
          const status = calculateBookingStatus(booking.startDate, booking.endDate)
          return status === 'confirmed' || status === 'active'
        })
        .map(booking => ({
          id: booking.id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          customer: booking.customer.name,
          customerPhone: booking.customer.phone1,
          quantity: booking.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
          status: calculateBookingStatus(booking.startDate, booking.endDate)
        })),
      reason: !isAvailable ? `Only ${availableQuantity} units available, but ${requestedQuantity} requested` : undefined
    })
  } catch (error) {
    console.error('Availability check error:', error)
    return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { checks } = body

    if (!Array.isArray(checks)) {
      return NextResponse.json({ error: 'checks must be an array' }, { status: 400 })
    }

    const results = await Promise.all(
      checks.map(async (check: any) => {
        const { productId, startDate, endDate, quantity = 1 } = check

        try {
          const start = new Date(startDate)
          const end = new Date(endDate)

          if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
            return {
              productId,
              available: false,
              error: 'Invalid dates'
            }
          }

          const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, name: true, quantity: true, status: true }
          })

          if (!product || !product.status) {
            return {
              productId,
              available: false,
              reason: product ? 'Product inactive' : 'Product not found'
            }
          }

          const overlappingBookings = await prisma.booking.findMany({
            where: {
              items: { some: { productId } },
              AND: [
                { startDate: { lte: end } },
                { endDate: { gte: start } }
              ]
            },
            include: {
              items: { where: { productId } }
            }
          })

          const bookedQuantity = overlappingBookings.reduce((total, booking) => {
            const status = calculateBookingStatus(booking.startDate, booking.endDate)
            // Only count bookings that are confirmed or active
            if (status === 'confirmed' || status === 'active') {
              return total + booking.items.reduce((itemTotal: number, item: any) => {
                return itemTotal + item.quantity
              }, 0)
            }
            return total
          }, 0)

          const availableQuantity = product.quantity - bookedQuantity
          const isAvailable = availableQuantity >= quantity

          return {
            productId,
            available: isAvailable,
            product: product.name,
            availableQuantity,
            totalquantity: product.quantity,
            requestedQuantity: quantity
          }
        } catch (error) {
          return {
            productId,
            available: false,
            error: 'Check failed'
          }
        }
      })
    )

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Bulk availability check error:', error)
    return NextResponse.json({ error: 'Failed to perform bulk availability check' }, { status: 500 })
  }
}
