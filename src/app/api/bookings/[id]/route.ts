import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BookingSchema } from '@/lib/validations'
import { calculateBookingStatus } from '@/lib/utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Valid booking ID is required' }, { status: 400 })
    }

    const body = await request.json()
    
    // Convert string dates to Date objects
    if (body.startDate) body.startDate = new Date(body.startDate)
    if (body.endDate) body.endDate = new Date(body.endDate)
    
    const validatedData = BookingSchema.omit({ id: true }).parse(body)
    
    // Check for conflicts with other bookings (excluding current booking)
    for (const item of validatedData.items) {
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

      // Check conflicts (excluding current booking)
      // Get all overlapping bookings first, then filter by calculated status
      const allOverlappingBookings = await prisma.booking.findMany({
        where: {
          id: { not: id }, // Exclude current booking
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

      const totalBookedQuantity = overlappingBookings.reduce((total, booking) => {
        return total + booking.items.reduce((itemTotal, bookingItem) => {
          return itemTotal + bookingItem.quantity
        }, 0)
      }, 0)

      const availableQuantity = product.quantity - totalBookedQuantity
      if (item.quantity > availableQuantity) {
        return NextResponse.json(
          { 
            error: `Insufficient quantity for "${product.name}". Requested: ${item.quantity}, Available: ${availableQuantity}, Total quantity: ${product.quantity}`,
            productId: product.id,
            requestedQuantity: item.quantity,
            availableQuantity: availableQuantity,
            totalQuantity: product.quantity,
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
    
    console.log('Updating booking with items:', JSON.stringify(itemsWithSubtotal, null, 2)); // Debug log
    
    // Delete existing items and create new ones
    const booking = await prisma.$transaction(async (tx) => {
      // Delete existing booking items
      await tx.bookingItem.deleteMany({
        where: { bookingId: id }
      })
      
      // Update booking
      return await tx.booking.update({
        where: { id },
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
    
    return NextResponse.json(bookingWithStatus)
  } catch (error: any) {
    console.error('Booking update error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Valid booking ID is required' }, { status: 400 })
    }
    
    // Check if booking is active (prevent deletion of active bookings)
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, startDate: true, endDate: true }
    })
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    
    // Calculate current status
    const status = calculateBookingStatus(booking.startDate, booking.endDate)
    
    if (status === 'active') {
      return NextResponse.json({ 
        error: 'Cannot delete active booking',
        details: 'Active bookings cannot be deleted. Please complete or cancel the booking first.',
        canDelete: false
      }, { status: 409 })
    }
    
    await prisma.booking.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Booking deleted successfully' })
  } catch (error: any) {
    console.error('Booking deletion error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Valid booking ID is required' }, { status: 400 })
    }
    
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    
    // Add calculated status to response
    const bookingWithStatus = {
      ...booking,
      status: calculateBookingStatus(booking.startDate, booking.endDate),
      customer: {
        ...booking.customer,
        email: booking.customer.phone1 // Use phone1 as email placeholder for UI compatibility
      }
    }
    
    return NextResponse.json(bookingWithStatus)
  } catch (error: any) {
    console.error('Booking fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 })
  }
}