import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    if (!search || search.length < 2) {
      return NextResponse.json([])
    }

    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: search } },
          { phone1: { contains: search } },
          { phone2: { contains: search } }
        ]
      },
      select: {
        id: true,
        name: true,
        phone1: true,
        phone2: true,
        address: true
      },
      take: 10
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Customer search error:', error)
    return NextResponse.json({ error: 'Failed to search customers' }, { status: 500 })
  }
}