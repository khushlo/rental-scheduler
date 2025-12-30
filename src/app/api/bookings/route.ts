import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BookingSchema } from '@/lib/validations'
import { calculateBookingStatus } from '@/lib/utils'
import { withAuth } from '@/lib/api-auth'

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

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url)
      const search = searchParams.get('search')
      const customerId = searchParams.get('customerId')
      const productId = searchParams.get('productId')
      // Note: status filtering is now done client-side using calculateBookingStatus

      let whereClause: any = {
        tenantId: user.tenantId // Filter by tenant
      }

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
        where: whereClause,
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
        status: calculateBookingStatus(booking.startDate, booking.endDate, undefined, booking.rowStatusCd),
        rowStatusCd: booking.rowStatusCd, // Include the new status field
        customer: {
          ...booking.customer,
          email: booking.customer.phone1 // Use phone1 as email placeholder for UI compatibility
        }
      }))

      return NextResponse.json(bookingsWithStatus)
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      
      // Convert string dates to Date objects
      if (body.startDate) body.startDate = new Date(body.startDate)
      if (body.endDate) body.endDate = new Date(body.endDate)
      if (body.eventDate && body.eventDate.trim()) body.eventDate = new Date(body.eventDate)
      else if (body.eventDate === '') body.eventDate = null
      
      const validatedData = BookingSchema.parse(body)
      
      // Check for conflicts with all products in the booking (improved quantity-aware detection)
      for (const item of validatedData.items) {
        // Get product to check available quantity - ensure it belongs to the user's tenant
        const product = await prisma.product.findUnique({
          where: { 
            id: item.productId,
            tenantId: user.tenantId // Ensure product belongs to user's tenant
          },
          select: { id: true, name: true, quantity: true }
        }) as { id: number; name: string; quantity: number } | null

        if (!product) {
          return NextResponse.json(
            { error: `Product with ID "${item.productId}" not found or not accessible` },
            { status: 404 }
          )
        }

        // Check current bookings for this product in the same time period
        // Get all potentially overlapping bookings first - filter by tenant
        const allOverlappingBookings = await prisma.booking.findMany({
          where: {
            tenantId: user.tenantId, // Only check bookings from the same tenant
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

      // Use Sweep Line Algorithm for accurate conflict detection
      const sweepResult = checkAvailabilityUsingSweepLine(
        allOverlappingBookings,
        newBookingStart,
        newBookingEnd,
        item.quantity,
        product.quantity
      )

      if (!sweepResult.available) {
        // Filter only active/confirmed bookings for display in error
        const conflictingBookings = allOverlappingBookings.filter(booking => {
          const status = calculateBookingStatus(booking.startDate, booking.endDate, undefined, booking.rowStatusCd)
          return status === 'confirmed' || status === 'active'
        })

        return NextResponse.json(
          { 
            error: `Insufficient quantity for "${product.name}". Requested: ${item.quantity}, Available: ${sweepResult.availableQuantity}, Total quantity: ${product.quantity}`,
            productId: product.id,
            requestedQuantity: item.quantity,
            availableQuantity: sweepResult.availableQuantity,
            totalquantity: product.quantity,
            conflictingBookings: conflictingBookings.map(b => ({
              id: b.id,
              startDate: b.startDate,
              endDate: b.endDate,
              startTime: b.startTime,
              endTime: b.endTime,
              customer: (b as any).customer.name,
              quantity: b.items.reduce((sum, i) => sum + i.quantity, 0)
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
    
    console.log('Creating booking with items:', JSON.stringify(itemsWithSubtotal, null, 2)); // Debug log
    
    const booking = await prisma.booking.create({
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
        tenantId: user.tenantId, // Add tenant ID from authenticated user
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
    
    return NextResponse.json(bookingWithStatus, { status: 201 })
    } catch (error) {
      console.error('Booking creation error:', error)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }
  });
}
