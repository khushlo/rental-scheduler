import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Try multiple ways to get the search parameter
    let search = searchParams.get('search') || searchParams.get('q') || searchParams.get('query')
    
    // Also try extracting from the URL directly if searchParams doesn't work
    if (!search) {
      const urlMatch = request.url.match(/[?&](search|q)=([^&]*)/i)
      if (urlMatch && urlMatch[2]) {
        search = decodeURIComponent(urlMatch[2])
      }
    }
    
    const tenantContext = getTenantFromRequest(request)

    // Basic logging for debugging
    console.log('Customer search request:', search, 'for tenant:', tenantContext.tenantId)

    if (!search || search.trim().length < 2) {
      return NextResponse.json([])
    }

    // Use Prisma query methods for better reliability and type safety
    const customers = await prisma.customer.findMany({
      where: {
        tenantId: tenantContext.tenantId,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone1: { contains: search, mode: 'insensitive' } },
          { phone2: { contains: search, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        phone1: true,
        phone2: true,
        address: true
      },
      take: 50,
      orderBy: [
        { name: 'asc' }
      ]
    })

    // Commented out raw SQL approach - use if advanced ordering is needed
    // const customers = await prisma.$queryRaw`
    //   SELECT id, name, phone1, phone2, address
    //   FROM "public"."customers"
    //   WHERE 
    //     "tenantId" = ${tenantContext.tenantId} AND (
    //       LOWER(name) LIKE LOWER(${`%${search}%`}) OR
    //       LOWER(phone1) LIKE LOWER(${`%${search}%`}) OR
    //       (phone2 IS NOT NULL AND LOWER(phone2) LIKE LOWER(${`%${search}%`}))
    //     )
    //   ORDER BY 
    //     CASE 
    //       WHEN LOWER(name) LIKE LOWER(${`${search}%`}) THEN 1
    //       WHEN LOWER(name) LIKE LOWER(${`%${search}%`}) THEN 2
    //       ELSE 3
    //     END
    //   LIMIT 50
    // ` as { id: number; name: string; phone1: string; phone2: string | null; address: string | null }[]

    console.log('Customer search results count:', customers.length)
    return NextResponse.json(customers)
  } catch (error) {
    console.error('Customer search error:', error)
    return NextResponse.json({ error: 'Failed to search customers' }, { status: 500 })
  }
}