import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    console.log('Customer search request:', search); // Debug log

    if (!search || search.length < 2) {
      return NextResponse.json([])
    }

    // Use case-insensitive search with ILIKE (PostgreSQL) or fallback to multiple contains
    const customers = await prisma.$queryRaw`
      SELECT id, name, phone1, phone2, address
      FROM customers
      WHERE 
        LOWER(name) LIKE LOWER(${`%${search}%`}) OR
        LOWER(phone1) LIKE LOWER(${`%${search}%`}) OR
        (phone2 IS NOT NULL AND LOWER(phone2) LIKE LOWER(${`%${search}%`}))
      ORDER BY 
        CASE 
          WHEN LOWER(name) LIKE LOWER(${`${search}%`}) THEN 1
          WHEN LOWER(name) LIKE LOWER(${`%${search}%`}) THEN 2
          ELSE 3
        END
      LIMIT 50
    ` as { id: number; name: string; phone1: string; phone2: string | null; address: string | null }[]

    console.log('Customer search results:', customers); // Debug log
    return NextResponse.json(customers)
  } catch (error) {
    console.error('Customer search error:', error)
    return NextResponse.json({ error: 'Failed to search customers' }, { status: 500 })
  }
}