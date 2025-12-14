import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'

async function getCustomersHandler(request: NextRequest) {
  try {
    // Get user info from headers set by middleware
    const tenantId = parseInt(request.headers.get('X-Tenant-ID') || '1')
    const userId = parseInt(request.headers.get('X-User-ID') || '0')
    
    const customers = await prisma.customer.findMany({
      where: {
        tenantId: tenantId
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    })
    
    return NextResponse.json(customers)
  } catch (error) {
    console.error('Get customers error:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

// Protected GET endpoint
export async function GET(request: NextRequest) {
  return withAuth(request, getCustomersHandler)
}

// You can also require specific tenant access
// export async function GET(request: NextRequest) {
//   return withAuth(request, getCustomersHandler, { requireTenantAccess: 1 })
// }