import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { IdLookupSchema } from '@/lib/validations'
import { calculateBookingStatus } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and type are required' }, { status: 400 })
    }

    const numericId = parseInt(id, 10)
    if (isNaN(numericId) || numericId <= 0) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const validatedData = IdLookupSchema.parse({ id: numericId, type })

    let result = null

    switch (validatedData.type) {
      case 'booking':
        result = await prisma.booking.findUnique({
          where: { id: validatedData.id },
          include: {
            customer: true,
            items: {
              include: {
                product: true
              }
            }
          }
        })
        break

      case 'customer':
        result = await prisma.customer.findUnique({
          where: { id: validatedData.id },
          include: {
            bookings: {
              include: {
                items: {
                  include: {
                    product: true
                  }
                }
              },
              orderBy: { startDate: 'desc' },
              take: 5 // Get last 5 bookings
            }
          }
        })
        break

      case 'product':
        result = await prisma.product.findUnique({
          where: { id: validatedData.id },
          include: {
            bookingItems: {
              include: {
                booking: {
                  include: {
                    customer: true
                  }
                }
              },
              orderBy: {
                booking: {
                  startDate: 'asc'
                }
              }
            }
          }
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    if (!result) {
      return NextResponse.json({ error: `${validatedData.type} not found` }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Lookup error:', error)
    return NextResponse.json({ error: 'Failed to lookup record' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, types } = body

    if (!Array.isArray(ids) || !Array.isArray(types) || ids.length !== types.length) {
      return NextResponse.json({ error: 'Invalid bulk lookup request' }, { status: 400 })
    }

    const results = await Promise.all(
      ids.map(async (id, index) => {
        const type = types[index]
        try {
          const validatedData = IdLookupSchema.parse({ id, type })
          
          switch (validatedData.type) {
            case 'booking':
              return await prisma.booking.findUnique({
                where: { id: validatedData.id },
                select: {
                  id: true,
                  startDate: true,
                  endDate: true,
                  customer: { select: { name: true } }
                }
              })

            case 'customer':
              return await prisma.customer.findUnique({
                where: { id: validatedData.id },
                select: {
                  id: true,
                  name: true,
                  phone1: true
                }
              })

            case 'product':
              return await prisma.product.findUnique({
                where: { id: validatedData.id },
                select: {
                  id: true,
                  name: true,
                  quantity: true,
                  status: true
                }
              })

            default:
              return null
          }
        } catch (error) {
          return null
        }
      })
    )

    return NextResponse.json(results)
  } catch (error) {
    console.error('Bulk lookup error:', error)
    return NextResponse.json({ error: 'Failed to perform bulk lookup' }, { status: 500 })
  }
}
