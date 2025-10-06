'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class MobileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Mobile Error Boundary caught an error:', error, errorInfo)
    
    // Prevent page reload on mobile by handling the error gracefully
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      // On mobile, try to recover instead of crashing
      setTimeout(() => {
        this.setState({ hasError: false })
      }, 1000)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          <h2 className="text-lg font-semibold text-red-600">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-600 text-center">
            The conversation encountered an error. This is common on mobile devices.
          </p>
          <Button
            onClick={() => this.setState({ hasError: false })}
            className="w-full"
          >
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
