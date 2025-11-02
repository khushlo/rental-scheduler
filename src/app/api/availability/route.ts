import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateBookingStatus } from '@/lib/utils'

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
      select: { id: true, name: true, quantity: true, status: true, delayInHours: true }
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
    // Enhanced to check individual item timing when available
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

    // Filter for actual time-based overlaps considering individual item timing
    const overlappingBookings = potentiallyOverlappingBookings.filter(booking => {
      // Check if any item in this booking conflicts with the requested time
      return booking.items.some((item: any) => {
        // Determine effective timing for this item
        let itemStartDateTime: Date;
        let itemEndDateTime: Date;

        // Check if item has individual timing (all timing fields must be present)
        if (item.itemStartDate && item.itemEndDate && item.itemStartTime && item.itemEndTime) {
          // Use individual item timing
          const itemStartDate = new Date(item.itemStartDate);
          const [itemStartHours, itemStartMinutes] = item.itemStartTime.split(':').map(Number);
          itemStartDateTime = new Date(itemStartDate);
          itemStartDateTime.setHours(itemStartHours, itemStartMinutes, 0, 0);

          const itemEndDate = new Date(item.itemEndDate);
          const [itemEndHours, itemEndMinutes] = item.itemEndTime.split(':').map(Number);
          itemEndDateTime = new Date(itemEndDate);
          itemEndDateTime.setHours(itemEndHours, itemEndMinutes, 0, 0);
        } else {
          // Use booking's general timing
          const bookingStart = new Date(booking.startDate);
          const [bookingStartHours, bookingStartMinutes] = booking.startTime.split(':').map(Number);
          itemStartDateTime = new Date(bookingStart);
          itemStartDateTime.setHours(bookingStartHours, bookingStartMinutes, 0, 0);

          const bookingEnd = new Date(booking.endDate);
          const [bookingEndHours, bookingEndMinutes] = booking.endTime.split(':').map(Number);
          itemEndDateTime = new Date(bookingEnd);
          itemEndDateTime.setHours(bookingEndHours, bookingEndMinutes, 0, 0);
        }

        // Note: Delay will be applied later in the availability calculation logic
        // Don't apply delay here as we need to check stock availability first

        // If no times provided for the request, use date-only logic (backward compatibility)
        if (!startTime || !endTime) {
          const requestStart = new Date(startDate);
          const requestEnd = new Date(endDate);
          let itemStart = new Date(item.itemStartDate || booking.startDate);
          let itemEnd = new Date(item.itemEndDate || booking.endDate);
          
          // Apply delay hours for date-only logic - delay not applied here initially
          // Will be handled in the final availability calculation
          
          return requestStart <= itemEnd && itemStart <= requestEnd;
        }

        // Check for time overlap using DateTime comparison
        // Two time periods overlap if: start1 < end2 AND start2 < end1
        return requestStartDateTime < itemEndDateTime && itemStartDateTime < requestEndDateTime;
      });
    })

    // Use Sweep Line Algorithm for accurate conflict detection
    const sweepResult = checkAvailabilityUsingSweepLine(
      overlappingBookings,
      requestStartDateTime,
      requestEndDateTime,
      requestedQuantity,
      product.quantity
    )

    const isAvailable = sweepResult.available
    const accurateAvailableQuantity = sweepResult.availableQuantity

    // Calculate available quantity for display purposes
    const bookedQuantity = overlappingBookings.reduce((total, booking) => {
      const status = calculateBookingStatus(booking.startDate, booking.endDate, undefined, booking.rowStatusCd)
      // Only count bookings that are confirmed or active
      if (status === 'confirmed' || status === 'active') {
        return total + (booking.items as any[]).reduce((itemTotal: number, bookingItem: any) => {
          return itemTotal + bookingItem.quantity
        }, 0)
      }
      return total
    }, 0)

    const availableQuantity = product.quantity - bookedQuantity

    // Apply delay logic - check if product has delay requirements
    let finalAvailability = isAvailable
    let delayApplied = false
    let availabilityWithDelay = availableQuantity
    let delayedOverlappingBookings = overlappingBookings // Initialize with default value
    
    if ((product as any).delayInHours && (product as any).delayInHours > 0) {
      // For products with delay, check if the new booking has sufficient gap time
      // Create timeline of all existing bookings to check for adequate spacing
      const delayMilliseconds = (product as any).delayInHours * 60 * 60 * 1000;
      
      delayedOverlappingBookings = potentiallyOverlappingBookings.filter(booking => {
        return booking.items.some((item: any) => {
          let itemStartDateTime: Date;
          let itemEndDateTime: Date;

          if (item.itemStartDate && item.itemEndDate && item.itemStartTime && item.itemEndTime) {
            const itemStartDate = new Date(item.itemStartDate);
            const [itemStartHours, itemStartMinutes] = item.itemStartTime.split(':').map(Number);
            itemStartDateTime = new Date(itemStartDate);
            itemStartDateTime.setHours(itemStartHours, itemStartMinutes, 0, 0);

            const itemEndDate = new Date(item.itemEndDate);
            const [itemEndHours, itemEndMinutes] = item.itemEndTime.split(':').map(Number);
            itemEndDateTime = new Date(itemEndDate);
            itemEndDateTime.setHours(itemEndHours, itemEndMinutes, 0, 0);
          } else {
            const bookingStart = new Date(booking.startDate);
            const [bookingStartHours, bookingStartMinutes] = booking.startTime.split(':').map(Number);
            itemStartDateTime = new Date(bookingStart);
            itemStartDateTime.setHours(bookingStartHours, bookingStartMinutes, 0, 0);

            const bookingEnd = new Date(booking.endDate);
            const [bookingEndHours, bookingEndMinutes] = booking.endTime.split(':').map(Number);
            itemEndDateTime = new Date(bookingEnd);
            itemEndDateTime.setHours(bookingEndHours, bookingEndMinutes, 0, 0);
          }

          if (!startTime || !endTime) {
            const requestStart = new Date(startDate);
            const requestEnd = new Date(endDate);
            let itemStart = new Date(item.itemStartDate || booking.startDate);
            let itemEnd = new Date(item.itemEndDate || booking.endDate);
            
            // Check if there's sufficient delay gap between bookings
            // Case 1: Existing booking ends before new booking starts
            if (itemEnd <= requestStart) {
              const gapAfterExisting = requestStart.getTime() - itemEnd.getTime();
              return gapAfterExisting < delayMilliseconds; // Conflict if gap is too small
            }
            
            // Case 2: New booking ends before existing booking starts  
            if (requestEnd <= itemStart) {
              const gapBeforeExisting = itemStart.getTime() - requestEnd.getTime();
              return gapBeforeExisting < delayMilliseconds; // Conflict if gap is too small
            }
            
            // Case 3: Bookings overlap in time - always a conflict
            return true;
          }

          // For time-based logic - check actual time gaps
          // Case 1: Existing booking ends before new booking starts
          if (itemEndDateTime <= requestStartDateTime) {
            const gapAfterExisting = requestStartDateTime.getTime() - itemEndDateTime.getTime();
            return gapAfterExisting < delayMilliseconds; // Conflict if gap is too small
          }
          
          // Case 2: New booking ends before existing booking starts
          if (requestEndDateTime <= itemStartDateTime) {
            const gapBeforeExisting = itemStartDateTime.getTime() - requestEndDateTime.getTime();
            return gapBeforeExisting < delayMilliseconds; // Conflict if gap is too small
          }
          
          // Case 3: Bookings overlap in time - always a conflict
          return true;
        });
      })

      const delayedBookedQuantity = delayedOverlappingBookings.reduce((total, booking) => {
        const status = calculateBookingStatus(booking.startDate, booking.endDate, undefined, booking.rowStatusCd)
        if (status === 'confirmed' || status === 'active') {
          return total + (booking.items as any[]).reduce((itemTotal: number, bookingItem: any) => {
            return itemTotal + bookingItem.quantity
          }, 0)
        }
        return total
      }, 0)

      availabilityWithDelay = product.quantity - delayedBookedQuantity
      finalAvailability = availabilityWithDelay >= requestedQuantity
      delayApplied = true
    }

    return NextResponse.json({
      available: finalAvailability,
      product,
      requestedQuantity,
      availableQuantity: delayApplied ? availabilityWithDelay : accurateAvailableQuantity,
      totalquantity: product.quantity,
      bookedQuantity: delayApplied ? (product.quantity - availabilityWithDelay) : (product.quantity - accurateAvailableQuantity),
      delayApplied,
      delayHours: delayApplied ? (product as any).delayInHours : 0,
      timeAware: !!(startTime && endTime),
      requestPeriod: {
        startDate: startDate,
        endDate: endDate,
        startTime: startTime || null,
        endTime: endTime || null,
        startDateTime: requestStartDateTime.toISOString(),
        endDateTime: requestEndDateTime.toISOString()
      },
      conflictingBookings: (delayApplied ? delayedOverlappingBookings : overlappingBookings)
        .filter(booking => {
          const status = calculateBookingStatus(booking.startDate, booking.endDate, undefined, booking.rowStatusCd)
          return status === 'confirmed' || status === 'active'
        })
        .map(booking => ({
          id: booking.id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          customer: (booking as any).customer.name,
          customerPhone: (booking as any).customer.phone1,
          quantity: (booking.items as any[]).reduce((sum: number, item: any) => sum + item.quantity, 0),
          status: calculateBookingStatus(booking.startDate, booking.endDate)
        })),
      reason: !finalAvailability ? `Only ${delayApplied ? availabilityWithDelay : accurateAvailableQuantity} units available${delayApplied ? ' (with ' + (product as any).delayInHours + 'h delay buffer)' : ''}, but ${requestedQuantity} requested` : undefined
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
            select: { id: true, name: true, quantity: true, status: true, delayInHours: true }
          }) as any // Use type casting until Prisma regeneration is fixed

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

          // Use Sweep Line Algorithm for accurate conflict detection
          const isAvailable = checkAvailabilityUsingSweepLine(
            overlappingBookings,
            requestStartDateTime,
            requestEndDateTime,
            quantity,
            product.quantity
          )

          // Calculate available quantity for display purposes
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

          // Apply delay logic - for products with delay, check conflicts with buffer time on BOTH sides
          let finalAvailability = isAvailable
          let delayApplied = false
          let availabilityWithDelay = availableQuantity
          
          if (product.delayInHours && product.delayInHours > 0) {
            // Check availability considering actual time gaps (not double delay buffers)
            const delayMilliseconds = product.delayInHours * 60 * 60 * 1000;
            
            const delayedFilteredBookings = overlappingBookings.filter(booking => {
              if (!startTime || !endTime) {
                const requestStart = new Date(startDate);
                const requestEnd = new Date(endDate);
                let bookingStart = new Date(booking.startDate);
                let bookingEnd = new Date(booking.endDate);
                
                // Check if there's sufficient delay gap between bookings
                // Case 1: Existing booking ends before new booking starts
                if (bookingEnd <= requestStart) {
                  const gapAfterExisting = requestStart.getTime() - bookingEnd.getTime();
                  return gapAfterExisting < delayMilliseconds; // Conflict if gap is too small
                }
                
                // Case 2: New booking ends before existing booking starts  
                if (requestEnd <= bookingStart) {
                  const gapBeforeExisting = bookingStart.getTime() - requestEnd.getTime();
                  return gapBeforeExisting < delayMilliseconds; // Conflict if gap is too small
                }
                
                // Case 3: Bookings overlap in time - always a conflict
                return true;
              }

              // Create DateTime objects for existing booking
              const bookingStart = new Date(booking.startDate)
              const [bookingStartHours, bookingStartMinutes] = booking.startTime.split(':').map(Number)
              bookingStart.setHours(bookingStartHours, bookingStartMinutes, 0, 0)

              let bookingEnd = new Date(booking.endDate)
              const [bookingEndHours, bookingEndMinutes] = booking.endTime.split(':').map(Number)
              bookingEnd.setHours(bookingEndHours, bookingEndMinutes, 0, 0)

              // For time-based logic - check actual time gaps
              // Case 1: Existing booking ends before new booking starts
              if (bookingEnd <= requestStartDateTime) {
                const gapAfterExisting = requestStartDateTime.getTime() - bookingEnd.getTime();
                return gapAfterExisting < delayMilliseconds; // Conflict if gap is too small
              }
              
              // Case 2: New booking ends before existing booking starts
              if (requestEndDateTime <= bookingStart) {
                const gapBeforeExisting = bookingStart.getTime() - requestEndDateTime.getTime();
                return gapBeforeExisting < delayMilliseconds; // Conflict if gap is too small
              }
              
              // Case 3: Bookings overlap in time - always a conflict
              return true;
            })

            const delayedBookedQuantity = delayedFilteredBookings.reduce((total, booking) => {
              const status = calculateBookingStatus(booking.startDate, booking.endDate)
              if (status === 'confirmed' || status === 'active') {
                return total + booking.items.reduce((itemTotal: number, item: any) => {
                  return itemTotal + item.quantity
                }, 0)
              }
              return total
            }, 0)

            availabilityWithDelay = product.quantity - delayedBookedQuantity
            finalAvailability = {
              available: availabilityWithDelay >= quantity,
              maxUsageDuringPeriod: delayedBookedQuantity,
              availableQuantity: availabilityWithDelay,
              peakUsage: delayedBookedQuantity
            }
            delayApplied = true
          }

          return {
            productId,
            available: finalAvailability,
            product: product.name,
            availableQuantity: delayApplied ? availabilityWithDelay : availableQuantity,
            totalquantity: product.quantity,
            requestedQuantity: quantity,
            delayApplied,
            delayHours: delayApplied ? product.delayInHours : 0,
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
