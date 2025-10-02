import { NextRequest, NextResponse } from 'next/server'

// This endpoint is deprecated as booking status is now calculated dynamically on the UI side
// No database status field is needed
export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Status update is no longer needed - status is calculated dynamically on UI side',
    deprecated: true
  })
}