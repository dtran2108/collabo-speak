'use client'

import { useEffect } from 'react'
import { MobileErrorUI } from '@/components/MobileErrorUI'
import { errorHandler } from '@/lib/error-handler'
import { mobileErrorHandler } from '@/lib/mobile-error-handler'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error
    errorHandler.logError(error, {
      component: 'GlobalError',
      digest: error.digest,
    })
  }, [error])

  // Use mobile-specific error UI if on mobile
  if (mobileErrorHandler.shouldShowMobileSpecificUI()) {
    return (
      <MobileErrorUI
        error={error}
        onRetry={reset}
        showDetails={process.env.NODE_ENV === 'development'}
      />
    )
  }

  // Desktop error UI
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Application Error
            </h1>
            
            <p className="text-gray-600 mb-6">
              Something went wrong with the application.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-left">
                <p className="text-sm font-medium text-red-800 mb-1">Error Details:</p>
                <p className="text-xs text-red-700 font-mono break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-red-600 mt-1">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Go Home
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
