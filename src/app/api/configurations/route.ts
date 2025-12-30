import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      // Get all active configurations from master with their values for the current tenant
      const configurations = await prisma.configMaster.findMany({
        where: {
          rowStatusCd: 'A', // Only active configurations
        },
        include: {
          configDetails: {
          where: {
            tenantId: user.tenantId
          }
        }
      },
      orderBy: { configName: 'asc' }
    })

    // Transform the data to include the current value for the tenant (or null if not set)
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
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      
      // Validate required fields for creating a tenant configuration value
      if (!body.configId || typeof body.configId !== 'number') {
        return NextResponse.json({ error: 'Configuration ID is required' }, { status: 400 })
      }

      if (!body.value || typeof body.value !== 'string') {
        return NextResponse.json({ error: 'Configuration value is required' }, { status: 400 })
      }

      // Check if configuration master exists
      const configMaster = await prisma.configMaster.findFirst({
        where: { 
          id: body.configId,
          rowStatusCd: 'A'
        }
      })

      if (!configMaster) {
        return NextResponse.json({ error: 'Configuration not found or inactive' }, { status: 404 })
      }

      // Check if this tenant already has a value for this configuration
      const existingDetail = await prisma.configDetails.findFirst({
        where: {
          configId: body.configId,
          tenantId: user.tenantId
        }
      })

      if (existingDetail) {
        return NextResponse.json({ error: 'Configuration already set for this tenant' }, { status: 400 })
      }

      // Create the config detail for the current tenant
      const configDetail = await prisma.configDetails.create({
        data: {
          configId: body.configId,
          tenantId: user.tenantId,
          value: body.value,
          modifiedBy: body.modifiedBy || 'System'
        },
        include: {
          configMaster: true
        }
      })

      return NextResponse.json({
        id: configMaster.id,
        configName: configMaster.configName,
        description: configMaster.description,
        rowStatusCd: configMaster.rowStatusCd,
        createdAt: configMaster.createdAt,
        updatedAt: configMaster.updatedAt,
        modifiedBy: configMaster.modifiedBy,
        value: configDetail.value,
        hasValue: true
      }, { status: 201 })
    } catch (error) {
      console.error('Failed to create configuration:', error)
      return NextResponse.json({ error: 'Failed to create configuration' }, { status: 500 })
    }
  });
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      
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
          tenantId: user.tenantId
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
          tenantId: user.tenantId,
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
  });
}