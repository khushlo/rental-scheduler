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

    // Calculate booked quantity from non-completed/non-cancelled bookings
    const bookedQuantity = overlappingBookings.reduce((total, booking) => {
      const status = calculateBookingStatus(booking.startDate, booking.endDate)
      // Only count bookings that are confirmed or active
      if (status === 'confirmed' || status === 'active') {
        return total + (booking.items as any[]).reduce((itemTotal: number, bookingItem: any) => {
          return itemTotal + bookingItem.quantity
        }, 0)
      }
      return total
    }, 0)

    const availableQuantity = product.quantity - bookedQuantity
    const isAvailable = availableQuantity >= requestedQuantity

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
        const status = calculateBookingStatus(booking.startDate, booking.endDate)
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
      availableQuantity: delayApplied ? availabilityWithDelay : availableQuantity,
      totalquantity: product.quantity,
      bookedQuantity: delayApplied ? (product.quantity - availabilityWithDelay) : bookedQuantity,
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
          const status = calculateBookingStatus(booking.startDate, booking.endDate)
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
      reason: !finalAvailability ? `Only ${delayApplied ? availabilityWithDelay : availableQuantity} units available${delayApplied ? ' (with ' + (product as any).delayInHours + 'h delay buffer)' : ''}, but ${requestedQuantity} requested` : undefined
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

          // Filter for actual time-based overlaps if times are provided (without delay initially)
          const filteredBookings = overlappingBookings.filter(booking => {
            // If no times provided for the request, use date-only logic (backward compatibility)
            if (!startTime || !endTime) {
              const requestStart = new Date(startDate);
              const requestEnd = new Date(endDate);
              let bookingStart = new Date(booking.startDate);
              let bookingEnd = new Date(booking.endDate);
              
              // Don't apply delay initially - will be handled in availability calculation
              return requestStart <= bookingEnd && bookingStart <= requestEnd;
            }

            // Create DateTime objects for existing booking
            const bookingStart = new Date(booking.startDate)
            const [bookingStartHours, bookingStartMinutes] = booking.startTime.split(':').map(Number)
            bookingStart.setHours(bookingStartHours, bookingStartMinutes, 0, 0)

            let bookingEnd = new Date(booking.endDate)
            const [bookingEndHours, bookingEndMinutes] = booking.endTime.split(':').map(Number)
            bookingEnd.setHours(bookingEndHours, bookingEndMinutes, 0, 0)

            // Don't apply delay initially - will be handled in availability calculation

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
            finalAvailability = availabilityWithDelay >= quantity
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
