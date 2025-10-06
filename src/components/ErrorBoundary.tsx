'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log error for production monitoring
    this.logError(error, errorInfo)
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
    }

    // Send to error logging service
    this.sendErrorToService(errorData)
  }

  private getUserId = (): string | null => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return null
      }
      // Try to get user ID from localStorage or context
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

  private getSessionId = (): string | null => {
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

  private sendErrorToService = async (errorData: Record<string, unknown>) => {
    try {
      if (typeof window === 'undefined' || typeof fetch === 'undefined') {
        // Server-side: just log to console
        console.error('Error (SSR):', errorData)
        return
      }
      
      // Send to your error logging service (e.g., Sentry, LogRocket, etc.)
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

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>

            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>

            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Please take a screenshot of
              this page and report this to our team.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-left">
                <p className="text-sm font-medium text-red-800 mb-1">
                  Error Details:
                </p>
                <p className="text-xs text-red-700 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>

              <Button
                onClick={this.handleReload}
                className="w-full"
                variant="outline"
              >
                Reload Page
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
