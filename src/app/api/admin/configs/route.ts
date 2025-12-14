import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all config masters
export async function GET() {
  try {
    const configs = await prisma.configMaster.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(configs);
  } catch (error) {
    console.error('Error fetching configs:', error);
    return NextResponse.json({ error: 'Failed to fetch configs' }, { status: 500 });
  }
}

// Create new config master
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { configName, description } = body;
    
    if (!configName) {
      return NextResponse.json({ 
        error: 'Config name is required' 
      }, { status: 400 });
    }

    // Check if config name already exists
    const existingConfig = await prisma.configMaster.findUnique({
      where: { configName }
    });

    if (existingConfig) {
      return NextResponse.json({ 
        error: 'Config name already exists' 
      }, { status: 409 });
    }
    
    const config = await prisma.configMaster.create({
      data: {
        configName,
        description: description || ''
      }
    });
    
    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error('Error creating config:', error);
    return NextResponse.json({ error: 'Failed to create config' }, { status: 500 });
  }
}