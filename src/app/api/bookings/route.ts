import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BookingSchema } from '@/lib/validations'
import { calculateBookingStatus } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const customerId = searchParams.get('customerId')
    const productId = searchParams.get('productId')
    // Note: status filtering is now done client-side using calculateBookingStatus

    let whereClause: any = {}

    // Add search functionality
    if (search) {
      const searchTerm = search.toLowerCase()
      
      // Try to parse search term as number for ID search
      const numericSearch = parseInt(search, 10)
      const searchConditions: any[] = [
        { customer: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { customer: { phone1: { contains: searchTerm, mode: 'insensitive' } } },
        { customer: { phone2: { contains: searchTerm, mode: 'insensitive' } } },
        { items: { some: { product: { name: { contains: searchTerm, mode: 'insensitive' } } } } },
        { notes: { contains: searchTerm, mode: 'insensitive' } }
      ]
      
      // Add numeric ID search if search term is a valid number
      if (!isNaN(numericSearch) && numericSearch > 0) {
        searchConditions.unshift({ id: numericSearch })
      }
      
      whereClause.OR = searchConditions
    }

    // Add specific filters
    if (customerId) {
      const numericCustomerId = parseInt(customerId, 10)
      if (!isNaN(numericCustomerId)) {
        whereClause.customerId = numericCustomerId
      }
    }

    if (productId) {
      const numericProductId = parseInt(productId, 10)
      if (!isNaN(numericProductId)) {
        whereClause.items = {
          some: {
            productId: numericProductId
          }
        }
      }
    }

    const bookings = await prisma.booking.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { startDate: 'asc' }
    })

    // Add calculated status to each booking
    const bookingsWithStatus = bookings.map(booking => ({
      ...booking,
      status: calculateBookingStatus(booking.startDate, booking.endDate),
      customer: {
        ...booking.customer,
        email: booking.customer.phone1 // Use phone1 as email placeholder for UI compatibility
      }
    }))

    return NextResponse.json(bookingsWithStatus)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Convert string dates to Date objects
    if (body.startDate) body.startDate = new Date(body.startDate)
    if (body.endDate) body.endDate = new Date(body.endDate)
    
    const validatedData = BookingSchema.parse(body)
    
    // Check for conflicts with all products in the booking (improved quantity-aware detection)
    for (const item of validatedData.items) {
      // Get product to check available quantity
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, quantity: true }
      }) as { id: number; name: string; quantity: number } | null

      if (!product) {
        return NextResponse.json(
          { error: `Product with ID "${item.productId}" not found` },
          { status: 404 }
        )
      }

      // Check current bookings for this product in the same time period
      // Get all potentially overlapping bookings first
      const allOverlappingBookings = await prisma.booking.findMany({
        where: {
          items: {
            some: {
              productId: item.productId
            }
          },
          AND: [
            {
              startDate: {
                lte: validatedData.endDate,
              }
            },
            {
              endDate: {
                gte: validatedData.startDate,
              }
            }
          ]
        },
        include: {
          items: {
            where: {
              productId: item.productId
            }
          }
        }
      })

      // Create DateTime objects for the new booking
      const newBookingStart = new Date(validatedData.startDate)
      const [newStartHours, newStartMinutes] = validatedData.startTime.split(':').map(Number)
      newBookingStart.setHours(newStartHours, newStartMinutes, 0, 0)

      const newBookingEnd = new Date(validatedData.endDate)
      const [newEndHours, newEndMinutes] = validatedData.endTime.split(':').map(Number)
      newBookingEnd.setHours(newEndHours, newEndMinutes, 0, 0)

      // Filter for actual time-based overlaps and active/confirmed bookings
      const overlappingBookings = allOverlappingBookings.filter(booking => {
        const status = calculateBookingStatus(booking.startDate, booking.endDate)
        if (status !== 'confirmed' && status !== 'active') {
          return false // Skip completed/cancelled bookings
        }

        // Create DateTime objects for existing booking
        const existingBookingStart = new Date(booking.startDate)
        const [existingStartHours, existingStartMinutes] = booking.startTime.split(':').map(Number)
        existingBookingStart.setHours(existingStartHours, existingStartMinutes, 0, 0)

        const existingBookingEnd = new Date(booking.endDate)
        const [existingEndHours, existingEndMinutes] = booking.endTime.split(':').map(Number)
        existingBookingEnd.setHours(existingEndHours, existingEndMinutes, 0, 0)

        // Check for time overlap: start1 < end2 AND start2 < end1
        return newBookingStart < existingBookingEnd && existingBookingStart < newBookingEnd
      })

      // Calculate total quantity already booked for this time period
      const totalBookedQuantity = overlappingBookings.reduce((total, booking) => {
        return total + booking.items.reduce((itemTotal, bookingItem) => {
          return itemTotal + bookingItem.quantity
        }, 0)
      }, 0)

      // Check if requested quantity exceeds available quantity
      const availablequantity = product.quantity - totalBookedQuantity
      if (item.quantity > availablequantity) {
        return NextResponse.json(
          { 
            error: `Insufficient quantity for "${product.name}". Requested: ${item.quantity}, Available: ${availablequantity}, Total quantity: ${product.quantity}`,
            productId: product.id,
            requestedQuantity: item.quantity,
            availableQuantity: availablequantity,
            totalquantity: product.quantity,
            conflictingBookings: overlappingBookings.map(b => ({
              id: b.id,
              startDate: b.startDate,
              endDate: b.endDate,
              startTime: b.startTime,
              endTime: b.endTime,
              quantity: b.items.reduce((sum, i) => sum + i.quantity, 0)
            }))
          },
          { status: 409 }
        )
      }
    }
    
    // Use subtotals from the request (preserving manual edits from UI)
    const itemsWithSubtotal = validatedData.items.map(item => ({
      ...item,
      // Use the subtotal from UI if provided, otherwise calculate it
      subtotal: item.subtotal !== undefined ? item.subtotal : 
                item.quantity * item.pricePerDay * Math.ceil((validatedData.endDate.getTime() - validatedData.startDate.getTime()) / (1000 * 60 * 60 * 24))
    }))
    
    console.log('Creating booking with items:', JSON.stringify(itemsWithSubtotal, null, 2)); // Debug log
    
    const booking = await prisma.booking.create({
      data: {
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        totalAmount: validatedData.totalAmount,
        advancePayment: validatedData.advancePayment,
        notes: validatedData.notes,
        customerId: validatedData.customerId,
        items: {
          create: itemsWithSubtotal
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })
    
    // Add calculated status to response
    const bookingWithStatus = {
      ...booking,
      status: calculateBookingStatus(booking.startDate, booking.endDate),
      customer: {
        ...booking.customer,
        email: booking.customer.phone1 // Use phone1 as email placeholder for UI compatibility
      }
    }
    
    return NextResponse.json(bookingWithStatus, { status: 201 })
  } catch (error) {
    console.error('Booking creation error:', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
