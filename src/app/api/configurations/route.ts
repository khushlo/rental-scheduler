import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request)
    
    // Get all configurations with their values for the current tenant
    const configurations = await prisma.configMaster.findMany({
      where: {
        rowStatusCd: 'A', // Only active configurations
      },
      include: {
        configDetails: {
          where: {
            tenantId: tenantContext.tenantId
          }
        }
      },
      orderBy: { configName: 'asc' }
    })

    // Transform the data to include the current value for the tenant
    const configsWithValues = configurations.map(config => ({
      id: config.id,
      configName: config.configName,
      description: config.description,
      rowStatusCd: config.rowStatusCd,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      modifiedBy: config.modifiedBy,
      value: config.configDetails.length > 0 ? config.configDetails[0].value : null,
      hasValue: config.configDetails.length > 0
    }))

    return NextResponse.json(configsWithValues)
  } catch (error) {
    console.error('Failed to fetch configurations:', error)
    return NextResponse.json({ error: 'Failed to fetch configurations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tenantContext = getTenantFromRequest(request)
    
    // Validate required fields for creating a new configuration
    if (!body.configName || typeof body.configName !== 'string') {
      return NextResponse.json({ error: 'Configuration name is required' }, { status: 400 })
    }

    // Check if configuration already exists
    const existingConfig = await prisma.configMaster.findUnique({
      where: { configName: body.configName }
    })

    if (existingConfig) {
      return NextResponse.json({ error: 'Configuration with this name already exists' }, { status: 400 })
    }

    // Create new configuration master
    const config = await prisma.configMaster.create({
      data: {
        configName: body.configName,
        description: body.description || null,
        rowStatusCd: body.rowStatusCd || 'A',
        modifiedBy: body.modifiedBy || 'System'
      }
    })

    // If a value is provided, create the config detail for the current tenant
    if (body.value !== undefined && body.value !== null) {
      await prisma.configDetails.create({
        data: {
          configId: config.id,
          tenantId: tenantContext.tenantId,
          value: body.value,
          modifiedBy: body.modifiedBy || 'System'
        }
      })
    }

    return NextResponse.json(config, { status: 201 })
  } catch (error) {
    console.error('Failed to create configuration:', error)
    return NextResponse.json({ error: 'Failed to create configuration' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const tenantContext = getTenantFromRequest(request)
    
    if (!body.configId || typeof body.configId !== 'number') {
      return NextResponse.json({ error: 'Configuration ID is required' }, { status: 400 })
    }

    // Check if the configuration exists
    const config = await prisma.configMaster.findUnique({
      where: { id: body.configId }
    })

    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    // Check if a config detail already exists for this tenant
    const existingDetail = await prisma.configDetails.findUnique({
      where: {
        configId_tenantId: {
          configId: body.configId,
          tenantId: tenantContext.tenantId
        }
      }
    })

    if (existingDetail) {
      // Update existing config detail
      const updatedDetail = await prisma.configDetails.update({
        where: { id: existingDetail.id },
        data: {
          value: body.value,
          modifiedBy: body.modifiedBy || 'System'
        }
      })
      return NextResponse.json(updatedDetail)
    } else {
      // Create new config detail for this tenant
      const newDetail = await prisma.configDetails.create({
        data: {
          configId: body.configId,
          tenantId: tenantContext.tenantId,
          value: body.value,
          modifiedBy: body.modifiedBy || 'System'
        }
      })
      return NextResponse.json(newDetail, { status: 201 })
    }
  } catch (error) {
    console.error('Failed to update configuration:', error)
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 })
  }
}