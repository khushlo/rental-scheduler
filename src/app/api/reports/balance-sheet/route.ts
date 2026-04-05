import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const year = searchParams.get('year') || '2026-27';

      // Parse the financial year to get start and end dates
      const [startYear, endYear] = year.split('-');
      
      // Convert 2-digit year to full year (e.g., "26" -> "2026")
      const fullStartYear = startYear.length === 2 ? `20${startYear}` : startYear;
      const fullEndYear = endYear.length === 2 ? `20${endYear}` : endYear;
      
      // Financial year runs from April 1st to March 31st
      const startDate = new Date(`${fullStartYear}-04-01T00:00:00.000Z`);
      const endDate = new Date(`${fullEndYear}-03-31T23:59:59.999Z`);

      console.log(`Fetching balance sheet for FY ${year}:`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // Fetch all bookings for the financial year - filtered by tenant
      const bookings = await prisma.booking.findMany({
        where: {
          tenantId: user.tenantId, // Filter by authenticated user's tenant
          OR: [
            // Bookings that start within the financial year
            {
              startDate: {
                gte: startDate,
                lte: endDate,
              },
            },
            // Bookings that end within the financial year
            {
              endDate: {
                gte: startDate,
                lte: endDate,
              },
            },
            // Bookings that span across the entire financial year
            {
              AND: [
                { startDate: { lte: startDate } },
                { endDate: { gte: endDate } },
              ],
            },
          ],
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    console.log(`Found ${bookings.length} bookings for the period`);

    // Calculate metrics
    const now = new Date();
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    const totalAdvanceReceived = bookings.reduce((sum, booking) => sum + (booking.advancePayment || 0), 0);
    const pendingPayments = totalRevenue - totalAdvanceReceived;
    
    // Categorize bookings based on current date
    const completedBookings = bookings.filter(booking => new Date(booking.endDate) < now).length;
    const activeBookings = bookings.filter(booking => 
      new Date(booking.startDate) <= now && new Date(booking.endDate) >= now
    ).length;
    const upcomingBookings = bookings.filter(booking => new Date(booking.startDate) > now).length;

    // Generate monthly breakdown
    const monthlyData = new Map();
    const months = [
      'April', 'May', 'June', 'July', 'August', 'September',
      'October', 'November', 'December', 'January', 'February', 'March'
    ];

    // Initialize all months with zero values
    months.forEach(month => {
      monthlyData.set(month, {
        month,
        revenue: 0,
        bookings: 0,
        advance: 0,
      });
    });

    // Populate with actual data
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.startDate);
      let monthIndex;
      
      // Determine which month this booking belongs to in the financial year
      const bookingMonth = bookingDate.getMonth(); // 0-based: Jan=0, Dec=11
      
      if (bookingMonth >= 3) { // April to December (3-11)
        monthIndex = bookingMonth - 3; // April = 0, May = 1, ..., December = 8
      } else { // January to March (0-2)
        monthIndex = bookingMonth + 9; // January = 9, February = 10, March = 11
      }
      
      const month = months[monthIndex];
      const existing = monthlyData.get(month);
      
      if (existing) {
        monthlyData.set(month, {
          month,
          revenue: existing.revenue + (booking.totalAmount || 0),
          bookings: existing.bookings + 1,
          advance: existing.advance + (booking.advancePayment || 0),
        });
      }
    });

    const monthlyBreakdown = Array.from(monthlyData.values());

    const balanceSheet = {
      financialYear: year,
      totalRevenue,
      totalAdvanceReceived,
      pendingPayments,
      totalBookings: bookings.length,
      completedBookings,
      activeBookings,
      upcomingBookings,
      monthlyBreakdown,
    };
    
    console.log('Balance sheet calculated:', {
      totalRevenue,
      totalBookings: bookings.length,
      monthlyBreakdown: monthlyBreakdown.slice(0, 3) // First 3 months for logging
    });

    return NextResponse.json(balanceSheet);
    } catch (error) {
      console.error('Error generating balance sheet:', error);
      return NextResponse.json(
        { 
          error: 'Failed to generate balance sheet',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}