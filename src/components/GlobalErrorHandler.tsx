'use client'

import { useEffect } from 'react'
import { errorHandler } from '@/lib/error-handler'

export function GlobalErrorHandler() {
  useEffect(() => {
    // Initialize global error handling
    errorHandler.init()
  }, [])

  return null
}
