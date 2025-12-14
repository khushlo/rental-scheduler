import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateBookingStatus } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    
    // Get tenant ID from headers (added by middleware)
    const tenantId = request.headers.get('X-Tenant-ID');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant information not available' },
        { status: 400 }
      );
    }

    const tenantIdNum = parseInt(tenantId);

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

    // Calculate monthly revenue (current month)
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const monthlyRevenue = allBookings
      .filter(booking => {
        const bookingDate = new Date(booking.startDate)
        return bookingDate.getMonth() === currentMonth && 
               bookingDate.getFullYear() === currentYear
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
}