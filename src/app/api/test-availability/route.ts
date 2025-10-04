import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Time-Aware Availability API Test Endpoint",
    timestamp: new Date().toISOString(),
    examples: {
      "date-only-check": "/api/availability?productId=1&startDate=2025-10-05&endDate=2025-10-05&quantity=2",
      "time-aware-check": "/api/availability?productId=1&startDate=2025-10-05&endDate=2025-10-05&startTime=09:00&endTime=12:00&quantity=2",
      "bulk-check": {
        method: "POST",
        endpoint: "/api/availability",
        body: {
          checks: [
            {
              productId: 1,
              startDate: "2025-10-05",
              endDate: "2025-10-05",
              startTime: "09:00",
              endTime: "12:00",
              quantity: 2
            }
          ]
        }
      }
    },
    improvements: [
      "✅ Time-aware conflict detection",
      "✅ Same-day booking with different time slots",
      "✅ Precise DateTime overlap checking",
      "✅ Enhanced availability response with time info",
      "✅ Backward compatibility maintained",
      "✅ UI automatically checks availability on time changes"
    ]
  })
}