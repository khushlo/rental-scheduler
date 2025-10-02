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
      const overlappingBookings = await prisma.booking.findMany({
        where: {
          status: {
            in: ['CONFIRMED', 'ACTIVE']
          },
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
              quantity: b.items.reduce((sum, i) => sum + i.quantity, 0)
            }))
          },
          { status: 409 }
        )
      }
    }
    
    // Calculate subtotals for each item
    const itemsWithSubtotal = validatedData.items.map(item => ({
      ...item,
      subtotal: item.quantity * item.pricePerDay * Math.ceil((validatedData.endDate.getTime() - validatedData.startDate.getTime()) / (1000 * 60 * 60 * 24))
    }))
    
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id || typeof id !== 'number') {
      return NextResponse.json({ error: 'Valid booking ID is required' }, { status: 400 })
    }
    
    // Convert string dates to Date objects
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate)
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate)
    
    const validatedData = BookingSchema.omit({ id: true }).parse(updateData)
    
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
      const overlappingBookings = await prisma.booking.findMany({
        where: {
          id: { not: id }, // Exclude current booking
          status: {
            in: ['CONFIRMED', 'ACTIVE']
          },
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

      const totalBookedQuantity = overlappingBookings.reduce((total, booking) => {
        return total + booking.items.reduce((itemTotal, bookingItem) => {
          return itemTotal + bookingItem.quantity
        }, 0)
      }, 0)

      const availableQuantity = product.quantity - totalBookedQuantity
      if (item.quantity > availableQuantity) {
        return NextResponse.json(
          { 
            error: `Insufficient quantity for "${product.name}". Requested: ${item.quantity}, Available: ${availableQuantity}`,
            productId: product.id,
            requestedQuantity: item.quantity,
            availableQuantity: availableQuantity,
            totalQuantity: product.quantity
          },
          { status: 409 }
        )
      }
    }
    
    // Calculate subtotals for items
    const itemsWithSubtotal = validatedData.items.map(item => ({
      ...item,
      subtotal: item.quantity * item.pricePerDay * Math.ceil((validatedData.endDate.getTime() - validatedData.startDate.getTime()) / (1000 * 60 * 60 * 24))
    }))
    
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'Valid booking ID is required' }, { status: 400 })
    }
    
    const bookingId = parseInt(id, 10)
    
    // Check if booking is active (prevent deletion of active bookings)
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, startDate: true, endDate: true }
    })
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    
    // Calculate current status
    const status = calculateBookingStatus(booking.startDate, booking.endDate)
    
    if (status === 'ACTIVE') {
      return NextResponse.json({ 
        error: 'Cannot delete active booking',
        details: 'Active bookings cannot be deleted. Please complete or cancel the booking first.',
        canDelete: false
      }, { status: 409 })
    }
    
    await prisma.booking.delete({
      where: { id: bookingId }
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
