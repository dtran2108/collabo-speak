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
          This app is still young! 🌱 I{"'"}ve tried my best to build it, but it
          might still have a few bugs. Thanks so much for your patience and
          understanding! If you notice any issues, please let me know via email
          at{' '}
          <a
            href="mailto:vuhuongnam07@gmail.com"
            className="underline hover:text-yellow-300 transition-colors"
          >
            vuhuongnam07@gmail.com
          </a>{' '}
          Your feedback really helps me make it better! 💬 This app is still
          young! 🌱 I{"'"}ve tried my best to build it, but it might still have
          a few bugs. Thanks so much for your patience and understanding! If you
          notice any issues, please let me know via email at{' '}
          <a
            href="mailto:vuhuongnam07@gmail.com"
            className="underline hover:text-yellow-300 transition-colors"
          >
            vuhuongnam07@gmail.com
          </a>{' '}
          Your feedback really helps me make it better! 💬
        </div>
      </div>
    </footer>
  )
}
