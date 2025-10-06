'use client'

import { useEffect, useState } from 'react'

export function Footer() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Add a small delay to prevent flash of content
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 z-50 overflow-hidden">
      <div className="relative w-full">
        <div className="animate-scroll whitespace-nowrap text-sm font-medium">
          🚀 I made this app in just 7 days, so it has lots of bugs! 
          If something breaks, please email me at{' '}
          <a 
            href="mailto:vuhuongnam07@gmail.com" 
            className="underline hover:text-yellow-300 transition-colors"
          >
            vuhuongnam07@gmail.com
          </a>
          {' '}and I will try to fix it! Your feedback means the world to me - every bug report helps me learn and improve! 
          🚀 I made this app in just 7 days, so it has lots of bugs! 
          If something breaks, please email me at{' '}
          <a 
            href="mailto:vuhuongnam07@gmail.com" 
            className="underline hover:text-yellow-300 transition-colors"
          >
            bugs@collabospeak.com
          </a>
          {' '}and I will try to fix it! Your feedback means the world to me - every bug report helps me learn and improve! 
        </div>
      </div>
    </footer>
  )
}
