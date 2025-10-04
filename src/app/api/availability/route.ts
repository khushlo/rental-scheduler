import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateBookingStatus } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')
    const quantity = searchParams.get('quantity')
    const excludeBookingId = searchParams.get('excludeBookingId')

    if (!productId || !startDate || !endDate) {
      return NextResponse.json({ error: 'productId, startDate, and endDate are required' }, { status: 400 })
    }

    // Validate time parameters - if one is provided, both should be provided
    if ((startTime && !endTime) || (!startTime && endTime)) {
      return NextResponse.json({ error: 'Both startTime and endTime must be provided when using time-based checking' }, { status: 400 })
    }

    // Create DateTime objects for precise time-based comparisons
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // If times are provided, create full DateTime objects
    let requestStartDateTime = start
    let requestEndDateTime = end
    
    if (startTime) {
      const [hours, minutes] = startTime.split(':').map(Number)
      requestStartDateTime = new Date(start)
      requestStartDateTime.setHours(hours, minutes, 0, 0)
    }
    
    if (endTime) {
      const [hours, minutes] = endTime.split(':').map(Number)
      requestEndDateTime = new Date(end)
      requestEndDateTime.setHours(hours, minutes, 0, 0)
    }

    const requestedQuantity = quantity ? parseInt(quantity) : 1
    const numericProductId = parseInt(productId, 10)
    const numericExcludeBookingId = excludeBookingId ? parseInt(excludeBookingId, 10) : null

    if (isNaN(numericProductId) || numericProductId <= 0) {
      return NextResponse.json({ error: 'Invalid productId' }, { status: 400 })
    }

    if (excludeBookingId && (isNaN(numericExcludeBookingId!) || numericExcludeBookingId! <= 0)) {
      return NextResponse.json({ error: 'Invalid excludeBookingId' }, { status: 400 })
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    if (requestStartDateTime >= requestEndDateTime) {
      return NextResponse.json({ error: 'Start date/time must be before end date/time' }, { status: 400 })
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
    // For time-aware checking, we need to get all potentially overlapping bookings
    // and then filter them based on actual time overlaps
    const potentiallyOverlappingBookings = await prisma.booking.findMany({
      where: {
        // Exclude the current booking if editing
        ...(numericExcludeBookingId && {
          id: {
            not: numericExcludeBookingId
          }
        }),
        items: {
          some: {
            productId: numericProductId
          }
        },
        AND: [
          {
            startDate: {
              lte: end, // Use date-only for initial filter
            }
          },
          {
            endDate: {
              gte: start, // Use date-only for initial filter
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

    // Filter for actual time-based overlaps if times are provided
    const overlappingBookings = potentiallyOverlappingBookings.filter(booking => {
      // If no times provided for the request, use date-only logic (backward compatibility)
      if (!startTime || !endTime) {
        return true // Keep all date-overlapping bookings
      }

      // Create DateTime objects for existing booking
      const bookingStart = new Date(booking.startDate)
      const [bookingStartHours, bookingStartMinutes] = booking.startTime.split(':').map(Number)
      bookingStart.setHours(bookingStartHours, bookingStartMinutes, 0, 0)

      const bookingEnd = new Date(booking.endDate)
      const [bookingEndHours, bookingEndMinutes] = booking.endTime.split(':').map(Number)
      bookingEnd.setHours(bookingEndHours, bookingEndMinutes, 0, 0)

      // Check for time overlap using DateTime comparison
      // Two time periods overlap if: start1 < end2 AND start2 < end1
      return requestStartDateTime < bookingEnd && bookingStart < requestEndDateTime
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
      timeAware: !!(startTime && endTime), // Indicate if time-based checking was used
      requestPeriod: {
        startDate: startDate,
        endDate: endDate,
        startTime: startTime || null,
        endTime: endTime || null,
        startDateTime: requestStartDateTime.toISOString(),
        endDateTime: requestEndDateTime.toISOString()
      },
      conflictingBookings: overlappingBookings
        .filter(booking => {
          const status = calculateBookingStatus(booking.startDate, booking.endDate)
          return status === 'confirmed' || status === 'active'
        })
        .map(booking => ({
          id: booking.id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
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
        const { productId, startDate, endDate, startTime, endTime, quantity = 1 } = check

        try {
          const start = new Date(startDate)
          const end = new Date(endDate)

          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return {
              productId,
              available: false,
              error: 'Invalid dates'
            }
          }

          // Create DateTime objects for precise time-based comparisons
          let requestStartDateTime = start
          let requestEndDateTime = end
          
          if (startTime) {
            const [hours, minutes] = startTime.split(':').map(Number)
            requestStartDateTime = new Date(start)
            requestStartDateTime.setHours(hours, minutes, 0, 0)
          }
          
          if (endTime) {
            const [hours, minutes] = endTime.split(':').map(Number)
            requestEndDateTime = new Date(end)
            requestEndDateTime.setHours(hours, minutes, 0, 0)
          }

          if (requestStartDateTime >= requestEndDateTime) {
            return {
              productId,
              available: false,
              error: 'Invalid date/time range'
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

          // Filter for actual time-based overlaps if times are provided
          const filteredBookings = overlappingBookings.filter(booking => {
            // If no times provided for the request, use date-only logic
            if (!startTime || !endTime) {
              return true
            }

            // Create DateTime objects for existing booking
            const bookingStart = new Date(booking.startDate)
            const [bookingStartHours, bookingStartMinutes] = booking.startTime.split(':').map(Number)
            bookingStart.setHours(bookingStartHours, bookingStartMinutes, 0, 0)

            const bookingEnd = new Date(booking.endDate)
            const [bookingEndHours, bookingEndMinutes] = booking.endTime.split(':').map(Number)
            bookingEnd.setHours(bookingEndHours, bookingEndMinutes, 0, 0)

            // Check for time overlap
            return requestStartDateTime < bookingEnd && bookingStart < requestEndDateTime
          })

          const bookedQuantity = filteredBookings.reduce((total, booking) => {
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
            requestedQuantity: quantity,
            timeAware: !!(startTime && endTime)
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
