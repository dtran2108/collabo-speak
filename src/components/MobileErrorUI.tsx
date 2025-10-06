'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Wifi, Settings, Smartphone } from 'lucide-react'
import { mobileErrorHandler } from '@/lib/mobile-error-handler'

interface MobileErrorUIProps {
  error: Error
  onRetry?: () => void
  onReload?: () => void
  showDetails?: boolean
}

export function MobileErrorUI({ 
  error, 
  onRetry, 
  onReload, 
  showDetails = false 
}: MobileErrorUIProps) {
  const mobileInfo = mobileErrorHandler.getMobileInfo()
  const isMobile = mobileInfo.isMobile
  const errorMessage = mobileErrorHandler.getMobileSpecificErrorMessage(error)
  const recoveryActions = mobileErrorHandler.getMobileSpecificRecoveryActions()

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  const handleReload = () => {
    if (onReload) {
      onReload()
    } else {
      window.location.reload()
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleClearCache = () => {
    if (mobileInfo.platform === 'android') {
      // For Android, we can't directly clear cache, but we can suggest it
      alert('To clear cache: Go to Settings > Apps > Browser > Storage > Clear Cache')
    } else if (mobileInfo.platform === 'ios') {
      // For iOS, suggest clearing Safari data
      alert('To clear cache: Go to Settings > Safari > Clear History and Website Data')
    } else {
      // For desktop browsers
      alert('Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac) to clear browser data')
    }
  }

  if (isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-sm w-full bg-white rounded-lg shadow-lg p-6">
          {/* Mobile-specific header */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-8 w-8 text-blue-500" />
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          
          <h1 className="text-lg font-semibold text-gray-900 mb-2 text-center">
            Oops! Something went wrong
          </h1>
          
          <p className="text-gray-600 mb-4 text-sm text-center">
            {errorMessage}
          </p>

          {/* Mobile-specific recovery actions */}
          <div className="space-y-3 mb-4">
            <Button
              onClick={handleRetry}
              className="w-full"
              size="lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button
              onClick={handleRefresh}
              className="w-full"
              variant="outline"
              size="lg"
            >
              <Wifi className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </div>

          {/* Mobile-specific troubleshooting */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Troubleshooting:
            </h3>
            <ul className="text-xs text-gray-600 space-y-1">
              {recoveryActions.slice(0, 3).map((action, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Device info for debugging */}
          {showDetails && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
              <p><strong>Device:</strong> {mobileInfo.deviceType} ({mobileInfo.platform})</p>
              <p><strong>Browser:</strong> {mobileInfo.browser}</p>
              <p><strong>Screen:</strong> {mobileInfo.screenSize.width}x{mobileInfo.screenSize.height}</p>
              <p><strong>Touch:</strong> {mobileInfo.touchSupport ? 'Yes' : 'No'}</p>
            </div>
          )}

          {/* Additional help button */}
          <div className="mt-4 text-center">
            <Button
              onClick={handleClearCache}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              <Settings className="w-3 h-3 mr-1" />
              Clear Cache
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Desktop version
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
          {errorMessage}
        </p>

        {showDetails && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-left">
            <p className="text-sm font-medium text-red-800 mb-1">Error Details:</p>
            <p className="text-xs text-red-700 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Button
            onClick={handleReload}
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
