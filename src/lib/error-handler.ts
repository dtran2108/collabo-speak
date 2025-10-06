interface ErrorData {
  message: string
  stack?: string
  timestamp: string
  userAgent: string
  url: string
  userId?: string | null
  sessionId?: string | null
  errorType: 'unhandled' | 'promise' | 'network' | 'component'
  additionalInfo?: Record<string, unknown>
}

class ErrorHandler {
  private isInitialized = false

  init() {
    if (this.isInitialized) return
    this.isInitialized = true

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }

    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        message: event.message,
        stack: event.error?.stack,
        errorType: 'unhandled',
        additionalInfo: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      })
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        errorType: 'promise',
        additionalInfo: {
          reason: event.reason,
        },
      })
    })

    // Handle network errors
    this.setupNetworkErrorHandling()
  }

  private setupNetworkErrorHandling() {
    // Override fetch to catch network errors
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        
        // Check for HTTP error status codes
        if (!response.ok) {
          this.handleError({
            message: `Network request failed: ${response.status} ${response.statusText}`,
            errorType: 'network',
            additionalInfo: {
              url: args[0],
              status: response.status,
              statusText: response.statusText,
            },
          })
        }
        
        return response
      } catch (error) {
        this.handleError({
          message: error instanceof Error ? error.message : 'Network request failed',
          stack: error instanceof Error ? error.stack : undefined,
          errorType: 'network',
          additionalInfo: {
            url: args[0],
            originalError: error,
          },
        })
        throw error
      }
    }
  }

  private handleError(errorData: Partial<ErrorData>) {
    const fullErrorData: ErrorData = {
      message: errorData.message || 'Unknown error',
      stack: errorData.stack,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      errorType: errorData.errorType || 'unhandled',
      additionalInfo: errorData.additionalInfo,
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error handler caught:', fullErrorData)
    }

    // Send to error logging service
    this.sendErrorToService(fullErrorData)
  }

  private getUserId(): string | null {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return null
      }
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        return user.id || null
      }
    } catch {
      // Ignore localStorage errors
    }
    return null
  }

  private getSessionId(): string | null {
    try {
      if (typeof window === 'undefined') {
        return null
      }
      const path = window.location.pathname
      const sessionMatch = path.match(/\/chat\/([^\/]+)/)
      return sessionMatch ? sessionMatch[1] : null
    } catch {
      return null
    }
  }

  private async sendErrorToService(errorData: ErrorData) {
    try {
      if (typeof window === 'undefined' || typeof fetch === 'undefined') {
        // Server-side: just log to console
        console.error('Error (SSR):', errorData)
        return
      }
      
      await fetch('/api/error-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      })
    } catch (e) {
      // Fallback: log to console if service is unavailable
      console.error('Failed to send error to logging service:', e)
    }
  }

  // Method to manually log errors
  logError(error: Error, additionalInfo?: Record<string, unknown>) {
    this.handleError({
      message: error.message,
      stack: error.stack,
      errorType: 'component',
      additionalInfo,
    })
  }
}

export const errorHandler = new ErrorHandler()
