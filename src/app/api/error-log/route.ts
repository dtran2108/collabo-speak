import { NextRequest, NextResponse } from 'next/server'

interface ErrorLogData {
  message: string
  stack?: string
  timestamp: string
  userAgent: string
  url: string
  userId?: string | null
  sessionId?: string | null
  errorType: 'unhandled' | 'promise' | 'network' | 'component'
  additionalInfo?: Record<string, unknown>
  componentStack?: string
}

export async function POST(request: NextRequest) {
  try {
    const errorData: ErrorLogData = await request.json()

    // Validate required fields
    if (!errorData.message || !errorData.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorData)
    }

    // In production, you would typically send this to an error monitoring service
    // like Sentry, LogRocket, Bugsnag, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to external service
      // await sendToErrorService(errorData)
      
      // For now, we'll just log to console
      // In a real production app, you'd want to:
      // 1. Send to Sentry, LogRocket, or similar
      // 2. Store in a database
      // 3. Send alerts for critical errors
      console.error('Production error:', {
        ...errorData,
        // Don't log sensitive user data in production logs
        userId: errorData.userId ? 'REDACTED' : null,
      })
    }

    // You could also store errors in a database here
    // await storeErrorInDatabase(errorData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in error-log API:', error)
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    )
  }
}

// Optional: Add a GET endpoint to retrieve error logs (for admin purposes)
export async function GET() {
  // This would typically require admin authentication
  // and return paginated error logs from your database
  
  return NextResponse.json({
    message: 'Error logs endpoint - implement based on your needs',
    // In a real app, you'd return actual error logs here
    errors: []
  })
}
