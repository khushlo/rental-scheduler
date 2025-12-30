import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateBookingStatus } from '@/lib/utils'
import { withAuth } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      // Get tenant ID from authenticated user
      const tenantIdNum = user.tenantId;

    // Get total customers count for this tenant
    const totalCustomers = await prisma.customer.count({
      where: { tenantId: tenantIdNum }
    })

    // Get all bookings for this tenant to calculate status-based counts and monthly revenue

    const allBookings = await prisma.booking.findMany({
      where: { tenantId: tenantIdNum },
      include: {
        items: true
      }
    })

    // Calculate bookings by status using the same logic as in utils
    let activeBookings = 0
    let completedBookings = 0
    let confirmedBookings = 0

    allBookings.forEach((booking, index) => {
      try {
        const status = calculateBookingStatus(booking.startDate, booking.endDate, undefined, booking.rowStatusCd)
       
        switch (status) {
          case 'active':
            activeBookings++
            break
          case 'completed':
            completedBookings++
            break
          case 'confirmed':
            confirmedBookings++
            break
        }
      } catch (statusError) {
        console.error(`Dashboard API: Error calculating status for booking ${booking.id}:`, statusError);
      }
    })

    // Calculate monthly revenue (current month) - using UTC to prevent hydration mismatches
    const now = new Date()
    const currentMonth = now.getUTCMonth()
    const currentYear = now.getUTCFullYear()
    
    const monthlyRevenue = allBookings
      .filter(booking => {
        const bookingDate = new Date(booking.startDate)
        return bookingDate.getUTCMonth() === currentMonth && 
               bookingDate.getUTCFullYear() === currentYear
      })
      .reduce((total, booking) => total + (booking.totalAmount || 0), 0)

    const result = {
      totalCustomers,
      activeBookings,
      completedBookings,
      confirmedBookings,
      monthlyRevenue
    };

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' }, 
      { status: 500 }
    )
  }
  });
}