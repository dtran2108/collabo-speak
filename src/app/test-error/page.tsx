'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { MobileErrorUI } from '@/components/MobileErrorUI'
import { errorHandler } from '@/lib/error-handler'
import { mobileErrorHandler } from '@/lib/mobile-error-handler'

// Component that throws an error for testing
function ErrorThrowingComponent() {
  const [shouldThrow, setShouldThrow] = useState(false)

  if (shouldThrow) {
    throw new Error('Test error for error boundary')
  }

  return (
    <div className="p-4">
      <Button onClick={() => setShouldThrow(true)}>
        Throw Error (Test Error Boundary)
      </Button>
    </div>
  )
}

// Component that triggers unhandled promise rejection
function PromiseErrorComponent() {
  const triggerPromiseError = () => {
    Promise.reject(new Error('Test unhandled promise rejection'))
  }

  return (
    <div className="p-4">
      <Button onClick={triggerPromiseError} variant="outline">
        Trigger Promise Error
      </Button>
    </div>
  )
}

// Component that triggers network error
function NetworkErrorComponent() {
  const triggerNetworkError = () => {
    fetch('/api/non-existent-endpoint')
      .then(() => {})
      .catch(() => {}) // This will still be caught by our global handler
  }

  return (
    <div className="p-4">
      <Button onClick={triggerNetworkError} variant="outline">
        Trigger Network Error
      </Button>
    </div>
  )
}

// Component that manually logs an error
function ManualErrorComponent() {
  const triggerManualError = () => {
    const error = new Error('Test manual error logging')
    errorHandler.logError(error, { test: true, component: 'ManualErrorTest' })
    alert('Error logged! Check console and network tab for error-log API call.')
  }

  return (
    <div className="p-4">
      <Button onClick={triggerManualError} variant="outline">
        Log Manual Error
      </Button>
    </div>
  )
}

export default function TestErrorPage() {
  const [showMobileUI, setShowMobileUI] = useState(false)
  const mobileInfo = mobileErrorHandler.getMobileInfo()

  const testMobileErrorUI = () => {
    setShowMobileUI(true)
  }

  if (showMobileUI) {
    return (
      <MobileErrorUI
        error={new Error('Test mobile error UI')}
        onRetry={() => setShowMobileUI(false)}
        showDetails={true}
      />
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Error Handling Test Page</h1>
      
      <div className="space-y-6">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Device Information</h2>
          <div className="text-sm text-gray-600">
            <p><strong>Device Type:</strong> {mobileInfo.deviceType}</p>
            <p><strong>Platform:</strong> {mobileInfo.platform}</p>
            <p><strong>Browser:</strong> {mobileInfo.browser}</p>
            <p><strong>Is Mobile:</strong> {mobileInfo.isMobile ? 'Yes' : 'No'}</p>
            <p><strong>Screen Size:</strong> {mobileInfo.screenSize.width}x{mobileInfo.screenSize.height}</p>
            <p><strong>Touch Support:</strong> {mobileInfo.touchSupport ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Error Boundary Test</h2>
          <p className="text-sm text-gray-600 mb-4">
            Click the button below to trigger an error that will be caught by the Error Boundary.
          </p>
          <ErrorBoundary
            onError={(error, errorInfo) => {
              console.log('ErrorBoundary caught error:', error, errorInfo)
            }}
          >
            <ErrorThrowingComponent />
          </ErrorBoundary>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Global Error Handler Tests</h2>
          <p className="text-sm text-gray-600 mb-4">
            These will trigger errors that are caught by the global error handler.
          </p>
          <div className="space-x-2">
            <PromiseErrorComponent />
            <NetworkErrorComponent />
            <ManualErrorComponent />
          </div>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Mobile Error UI Test</h2>
          <p className="text-sm text-gray-600 mb-4">
            Test the mobile-specific error UI component.
          </p>
          <Button onClick={testMobileErrorUI} variant="outline">
            Show Mobile Error UI
          </Button>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Instructions</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>1. Open browser dev tools (F12)</p>
            <p>2. Go to Console tab to see error logs</p>
            <p>3. Go to Network tab to see error-log API calls</p>
            <p>4. Test on mobile device to see mobile-specific UI</p>
            <p>5. Check production logs for error reporting</p>
          </div>
        </div>
      </div>
    </div>
  )
}
