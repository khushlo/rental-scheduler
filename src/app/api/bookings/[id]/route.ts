import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BookingSchema } from '@/lib/validations'
import { calculateBookingStatus } from '@/lib/utils'

interface BookingWithItems {
  id: number
  startDate: Date
  endDate: Date
  startTime: string
  endTime: string
  rowStatusCd: string
  items: Array<{
    id: number
    quantity: number
    productId: number
    itemStartDate?: Date | null
    itemEndDate?: Date | null
    itemStartTime?: string | null
    itemEndTime?: string | null
  }>
  customer: {
    name: string
    phone1: string | null
  }
}

interface SweepEvent {
  time: Date
  change: number // +quantity for start, -quantity for end
  type: 'start' | 'end'
  bookingId: number
}

interface AvailabilityResult {
  available: boolean
  maxUsageDuringPeriod: number
  availableQuantity: number
  peakUsage: number
}

/**
 * Enhanced Sweep Line Algorithm for conflict detection with detailed availability info
 * Handles tie-breaking: when events happen at the same time, END events are processed first
 */
function checkAvailabilityUsingSweepLine(
  overlappingBookings: any[],
  requestStart: Date,
  requestEnd: Date,
  requestedQuantity: number,
  totalQuantity: number
): AvailabilityResult {
  const events: SweepEvent[] = []

  // Add existing booking events (only confirmed/active bookings)
  overlappingBookings.forEach(booking => {
    const status = calculateBookingStatus(booking.startDate, booking.endDate, undefined, booking.rowStatusCd)
    if (status === 'confirmed' || status === 'active') {
      const bookingQuantity = booking.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      
      // Create start and end times for this booking
      const bookingStart = new Date(booking.startDate)
      const [startHours, startMinutes] = booking.startTime.split(':').map(Number)
      bookingStart.setHours(startHours, startMinutes, 0, 0)
      
      const bookingEnd = new Date(booking.endDate)
      const [endHours, endMinutes] = booking.endTime.split(':').map(Number)
      bookingEnd.setHours(endHours, endMinutes, 0, 0)
      
      events.push({
        time: bookingStart,
        change: bookingQuantity,
        type: 'start',
        bookingId: booking.id
      })
      
      events.push({
        time: bookingEnd,
        change: -bookingQuantity,
        type: 'end',
        bookingId: booking.id
      })
    }
  })

  // Sort events with tie-breaker rule (without adding new booking yet)
  events.sort((a, b) => {
    const timeDiff = a.time.getTime() - b.time.getTime()
    if (timeDiff !== 0) return timeDiff
    
    // Tie-breaker: negative changes (end events) come before positive changes (start events)
    return a.change - b.change
  })

  // Calculate usage at the start of the requested period (without the new booking)
  let currentUsage = 0
  let maxUsageDuringPeriod = 0
  let usageAtRequestStart = 0
  
  for (const event of events) {
    currentUsage += event.change
    
    // Track usage exactly at the start time of the request
    if (event.time <= requestStart) {
      usageAtRequestStart = currentUsage
    }
    
    // Also track maximum usage during the requested time period for existing logic
    if (event.time >= requestStart && event.time < requestEnd) {
      maxUsageDuringPeriod = Math.max(maxUsageDuringPeriod, currentUsage)
    }
  }

  // Now add the new booking events and check for conflicts
  events.push({
    time: requestStart,
    change: requestedQuantity,
    type: 'start',
    bookingId: -1
  })
  
  events.push({
    time: requestEnd,
    change: -requestedQuantity,
    type: 'end',
    bookingId: -1
  })

  // Re-sort with new booking events
  events.sort((a, b) => {
    const timeDiff = a.time.getTime() - b.time.getTime()
    if (timeDiff !== 0) return timeDiff
    return a.change - b.change
  })

  // Sweep through events and track peak usage
  currentUsage = 0
  let peakUsage = 0
  let isAvailable = true
  
  for (const event of events) {
    currentUsage += event.change
    peakUsage = Math.max(peakUsage, currentUsage)
    
    // If usage exceeds total quantity at any point, there's a conflict
    if (currentUsage > totalQuantity) {
      isAvailable = false
    }
  }

  const availableQuantity = totalQuantity - usageAtRequestStart

  return {
    available: isAvailable,
    maxUsageDuringPeriod,
    availableQuantity,
    peakUsage
  }
}

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
    if (body.eventDate && body.eventDate.trim()) body.eventDate = new Date(body.eventDate)
    else if (body.eventDate === '') body.eventDate = null
    
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
          },
          customer: {
            select: { name: true, phone1: true }
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

      // Use Sweep Line Algorithm for accurate conflict detection (excluding current booking)
      const sweepResult = checkAvailabilityUsingSweepLine(
        allOverlappingBookings,
        newBookingStart,
        newBookingEnd,
        item.quantity,
        product.quantity
      )

      if (!sweepResult.available) {
        // Filter only active/confirmed bookings for display in error
        const conflictingBookings = allOverlappingBookings.filter((booking: any) => {
          const status = calculateBookingStatus(booking.startDate, booking.endDate, undefined, booking.rowStatusCd)
          return status === 'confirmed' || status === 'active'
        })

        return NextResponse.json(
          { 
            error: `Insufficient quantity for "${product.name}". Requested: ${item.quantity}, Available: ${sweepResult.availableQuantity}, Total quantity: ${product.quantity}`,
            productId: product.id,
            requestedQuantity: item.quantity,
            availableQuantity: sweepResult.availableQuantity,
            totalQuantity: product.quantity,
            conflictingBookings: conflictingBookings.map((b: any) => ({
              id: b.id,
              startDate: b.startDate,
              endDate: b.endDate,
              startTime: b.startTime,
              endTime: b.endTime,
              customer: b.customer.name,
              quantity: b.items.reduce((sum: number, i: any) => sum + i.quantity, 0)
            }))
          },
          { status: 409 }
        )
      }
    }
    
    // Use subtotals from the request (preserving manual edits from UI)
    const itemsWithSubtotal = validatedData.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      pricePerDay: item.pricePerDay,
      notes: item.notes,
      // Use the subtotal from UI if provided, otherwise calculate as quantity * pricePerDay (one-time rental)
      subtotal: item.subtotal !== undefined ? item.subtotal : item.quantity * item.pricePerDay,
      // Include individual timing fields (convert dates to Date objects if provided)
      itemStartDate: item.itemStartDate ? new Date(item.itemStartDate) : null,
      itemEndDate: item.itemEndDate ? new Date(item.itemEndDate) : null,
      itemStartTime: item.itemStartTime || null,
      itemEndTime: item.itemEndTime || null,
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
          eventDate: validatedData.eventDate,  // Add event date
          totalAmount: validatedData.totalAmount,
          advancePayment: validatedData.advancePayment,
          notes: validatedData.notes,
          customerId: validatedData.customerId,
          rowStatusCd: validatedData.rowStatusCd || 'A', // Set row status code
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
      status: calculateBookingStatus(booking.startDate, booking.endDate, undefined, booking.rowStatusCd),
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
    
    // Find the booking to delete
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true }
    })
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    
    // Delete the booking (allow deletion regardless of status)
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
        tenant: {
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
            storeTimezone: true
          }
        },
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
      status: calculateBookingStatus(booking.startDate, booking.endDate, undefined, booking.rowStatusCd),
      rowStatusCd: booking.rowStatusCd, // Include the new status field
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