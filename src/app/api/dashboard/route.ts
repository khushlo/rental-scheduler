import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateBookingStatus } from '@/lib/utils'

export async function GET() {
  try {
    // Get total customers count
    const totalCustomers = await prisma.customer.count()

    // Get all bookings to calculate status-based counts and monthly revenue
    const allBookings = await prisma.booking.findMany({
      include: {
        items: true
      }
    })

    // Calculate bookings by status using the same logic as in utils
    let activeBookings = 0
    let completedBookings = 0
    let confirmedBookings = 0

    allBookings.forEach(booking => {
      const status = calculateBookingStatus(booking.startDate, booking.endDate)
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
      .reduce((total, booking) => total + booking.totalAmount, 0)

    return NextResponse.json({
      totalCustomers,
      activeBookings,
      completedBookings,
      confirmedBookings,
      monthlyRevenue
    })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' }, 
      { status: 500 }
    )
  }
}