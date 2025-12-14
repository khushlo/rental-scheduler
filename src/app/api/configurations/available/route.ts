import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request)
    
    // Get all active configurations from master that don't have values for this tenant
    const availableConfigurations = await prisma.configMaster.findMany({
      where: {
        rowStatusCd: 'A',
        configDetails: {
          none: {
            tenantId: tenantContext.tenantId
          }
        }
      },
      select: {
        id: true,
        configName: true,
        description: true
      },
      orderBy: { configName: 'asc' }
    })

    return NextResponse.json(availableConfigurations)
  } catch (error) {
    console.error('Failed to fetch available configurations:', error)
    return NextResponse.json({ error: 'Failed to fetch available configurations' }, { status: 500 })
  }
}