import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Update config master
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const configId = parseInt(id);
    const body = await request.json();
    const { configName, description } = body;
    
    if (!configName) {
      return NextResponse.json({ 
        error: 'Config name is required' 
      }, { status: 400 });
    }

    // Check if config exists
    const existingConfig = await prisma.configMaster.findUnique({
      where: { id: configId }
    });

    if (!existingConfig) {
      return NextResponse.json({ 
        error: 'Config not found' 
      }, { status: 404 });
    }

    // Check if new config name conflicts with another record
    if (configName !== existingConfig.configName) {
      const conflictingConfig = await prisma.configMaster.findUnique({
        where: { configName }
      });

      if (conflictingConfig) {
        return NextResponse.json({ 
          error: 'Config name already exists' 
        }, { status: 409 });
      }
    }
    
    const updatedConfig = await prisma.configMaster.update({
      where: { id: configId },
      data: {
        configName,
        description: description || ''
      }
    });
    
    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}

// Delete config master
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const configId = parseInt(id);
    
    // Check if config exists
    const existingConfig = await prisma.configMaster.findUnique({
      where: { id: configId }
    });

    if (!existingConfig) {
      return NextResponse.json({ 
        error: 'Config not found' 
      }, { status: 404 });
    }

    // Check if config is being used in any config details
    const configDetails = await prisma.configDetails.findFirst({
      where: { configId: configId }
    });

    if (configDetails) {
      return NextResponse.json({ 
        error: 'Cannot delete config that is being used. Please remove all config details first.' 
      }, { status: 409 });
    }
    
    await prisma.configMaster.delete({
      where: { id: configId }
    });
    
    return NextResponse.json({ message: 'Config deleted successfully' });
  } catch (error) {
    console.error('Error deleting config:', error);
    return NextResponse.json({ error: 'Failed to delete config' }, { status: 500 });
  }
}