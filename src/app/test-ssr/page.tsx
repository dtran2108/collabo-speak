'use client'

import { useEffect, useState } from 'react'
import { mobileErrorHandler } from '@/lib/mobile-error-handler'
import { errorHandler } from '@/lib/error-handler'

interface MobileErrorData {
  isMobile: boolean
  deviceType: 'mobile' | 'tablet' | 'desktop'
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown'
  browser: string
  screenSize: {
    width: number
    height: number
  }
  touchSupport: boolean
  orientation: 'portrait' | 'landscape'
}

export default function TestSSRPage() {
  const [isClient, setIsClient] = useState(false)
  const [mobileInfo, setMobileInfo] = useState<MobileErrorData | null>(null)

  useEffect(() => {
    setIsClient(true)
    setMobileInfo(mobileErrorHandler.getMobileInfo())
  }, [])

  const testErrorLogging = () => {
    const error = new Error('Test SSR error logging')
    errorHandler.logError(error, { test: 'ssr' })
    alert('Error logged! Check console.')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">SSR Error Handling Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Client/Server Detection</h2>
          <p><strong>Is Client:</strong> {isClient ? 'Yes' : 'No'}</p>
          <p><strong>Window Available:</strong> {typeof window !== 'undefined' ? 'Yes' : 'No'}</p>
          <p><strong>Navigator Available:</strong> {typeof navigator !== 'undefined' ? 'Yes' : 'No'}</p>
        </div>

        {isClient && mobileInfo && (
          <div className="p-4 border rounded">
            <h2 className="text-lg font-semibold mb-2">Mobile Info (Client-side)</h2>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(mobileInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Error Logging Test</h2>
          <p className="text-sm text-gray-600 mb-2">
            Test error logging (should work on both server and client)
          </p>
          <button
            onClick={testErrorLogging}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test Error Logging
          </button>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Instructions</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• This page should load without SSR errors</p>
            <p>• Mobile info should only show on client-side</p>
            <p>• Error logging should work on both server and client</p>
            <p>• Check browser console for any errors</p>
          </div>
        </div>
      </div>
    </div>
  )
}
