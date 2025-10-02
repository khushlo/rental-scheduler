import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { determineBookingStatus } from '@/lib/utils'

// Utility API to update existing booking statuses based on new logic
export async function POST(request: NextRequest) {
  try {
    // Get all bookings that aren't completed or cancelled
    const bookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMED', 'ACTIVE']
        }
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true
      }
    })

    const updates = []
    
    for (const booking of bookings) {
      const newStatus = determineBookingStatus(booking.startDate, booking.endDate, booking.status as string)
      
      if (newStatus !== booking.status) {
        updates.push(
          prisma.booking.update({
            where: { id: booking.id },
            data: { 
              status: newStatus as 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
            }
          })
        )
      }
    }

    // Execute all updates
    await prisma.$transaction(updates)

    return NextResponse.json({ 
      message: `Updated ${updates.length} booking statuses`,
      updatedCount: updates.length
    })
  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json({ error: 'Failed to update booking statuses' }, { status: 500 })
  }
}