'use client'

import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
  variant?: 'default' | 'logo'
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
}

const logoSizes = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-24 w-24'
}

// CollaboSpeak Logo Component with GSAP Animation
function CollaboSpeakLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const blueCircleRef = useRef<SVGCircleElement>(null)
  const yellowCircleRef = useRef<SVGCircleElement>(null)
  const pinkCircleRef = useRef<SVGCircleElement>(null)
  const blueBubbleRef = useRef<SVGPathElement>(null)
  const yellowBubbleRef = useRef<SVGPathElement>(null)
  const pinkBubbleRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    if (!svgRef.current || !blueCircleRef.current || !yellowCircleRef.current || !pinkCircleRef.current || 
        !blueBubbleRef.current || !yellowBubbleRef.current || !pinkBubbleRef.current) return

    // Create a timeline for smooth, coordinated animations
    const tl = gsap.timeline({ repeat: -1 })

    // Create a stroke drawing animation that fills the entire logo
    // Start with all elements transparent and add colored strokes
    gsap.set([blueCircleRef.current, blueBubbleRef.current], {
      fill: "transparent",
      stroke: "#4294AA", // Blue stroke
      strokeWidth: 2,
      strokeDasharray: "1000",
      strokeDashoffset: "1000"
    })
    gsap.set([yellowCircleRef.current, yellowBubbleRef.current], {
      fill: "transparent",
      stroke: "#F5BF45", // Yellow stroke
      strokeWidth: 2,
      strokeDasharray: "1000",
      strokeDashoffset: "1000"
    })
    gsap.set([pinkCircleRef.current, pinkBubbleRef.current], {
      fill: "transparent",
      stroke: "#EF859F", // Pink stroke
      strokeWidth: 2,
      strokeDasharray: "1000",
      strokeDashoffset: "1000"
    })
    
    // Animate stroke drawing for each element (super fast)
    tl.to(blueCircleRef.current, {
      strokeDashoffset: 0,
      duration: 0.3,
      ease: "power2.inOut"
    })
    .to(yellowCircleRef.current, {
      strokeDashoffset: 0,
      duration: 0.3,
      ease: "power2.inOut"
    }, "-=0.2")
    .to(pinkCircleRef.current, {
      strokeDashoffset: 0,
      duration: 0.3,
      ease: "power2.inOut"
    }, "-=0.2")
    .to(blueBubbleRef.current, {
      strokeDashoffset: 0,
      duration: 0.4,
      ease: "power2.inOut"
    }, "-=0.15")
    .to(yellowBubbleRef.current, {
      strokeDashoffset: 0,
      duration: 0.4,
      ease: "power2.inOut"
    }, "-=0.25")
    .to(pinkBubbleRef.current, {
      strokeDashoffset: 0,
      duration: 0.4,
      ease: "power2.inOut"
    }, "-=0.25")
    
    // Fill with colors after stroke is complete (super fast)
    .to(blueCircleRef.current, {
      fill: "#4294AA",
      duration: 0.15,
      ease: "power2.out"
    }, "-=0.1")
    .to(yellowCircleRef.current, {
      fill: "#F5BF45",
      duration: 0.15,
      ease: "power2.out"
    }, "-=0.1")
    .to(pinkCircleRef.current, {
      fill: "#EF859F",
      duration: 0.15,
      ease: "power2.out"
    }, "-=0.1")
    .to(blueBubbleRef.current, {
      fill: "#4294AA",
      duration: 0.15,
      ease: "power2.out"
    }, "-=0.05")
    .to(yellowBubbleRef.current, {
      fill: "#F5BF45",
      duration: 0.15,
      ease: "power2.out"
    }, "-=0.1")
    .to(pinkBubbleRef.current, {
      fill: "#EF859F",
      duration: 0.15,
      ease: "power2.out"
    }, "-=0.1")
    
    // Add a subtle pulse effect after filling (super fast)
    .to([blueCircleRef.current, yellowCircleRef.current, pinkCircleRef.current, 
         blueBubbleRef.current, yellowBubbleRef.current, pinkBubbleRef.current], {
      scale: 1.05,
      duration: 0.1,
      ease: "power2.out",
      yoyo: true,
      repeat: 1
    })
    
    // Remove stroke and reset (super fast)
    .to([blueCircleRef.current, yellowCircleRef.current, pinkCircleRef.current, 
         blueBubbleRef.current, yellowBubbleRef.current, pinkBubbleRef.current], {
      strokeWidth: 0,
      duration: 0.1,
      ease: "power2.inOut"
    })
    .to([blueCircleRef.current, yellowCircleRef.current, pinkCircleRef.current, 
         blueBubbleRef.current, yellowBubbleRef.current, pinkBubbleRef.current], {
      scale: 1,
      duration: 0.15,
      ease: "power2.inOut"
    })

    return () => {
      tl.kill()
    }
  }, [])

  return (
    <div className={cn('relative', logoSizes[size])}>
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox="0 0 216 177" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Animated circles with GSAP */}
        <circle 
          ref={blueCircleRef}
          cx="48" 
          cy="46" 
          r="22" 
          fill="#4294AA"
        />
        <circle 
          ref={yellowCircleRef}
          cx="102" 
          cy="26" 
          r="26" 
          fill="#F5BF45"
        />
        <circle 
          ref={pinkCircleRef}
          cx="159" 
          cy="34" 
          r="22" 
          fill="#EF859F"
        />
        {/* Speech bubbles - animated */}
        <path 
          ref={blueBubbleRef}
          d="M64.4866 69.5001C57.2866 71.5001 45.4866 80.6667 40.4866 85.0001C21.2866 77.8001 11.4955 59.6668 9 51.5001C4.2 45.9001 1.33333 50.5001 0.5 53.5001C2.5 76.3001 21.3244 92.3334 30.4866 97.5001C21.5001 113 18.5008 144 65.4866 166.5C69.4866 166.5 70.4866 164.167 70.4866 163V72.5001C69.6866 68.9001 66.1533 69.0001 64.4866 69.5001Z" 
          fill="#4294AA"
        />
        <path 
          ref={yellowBubbleRef}
          d="M77.0156 167.5V67.0001C79 60.5 131.016 52.3001 131.016 61.5001V173C129.416 180.6 77.0156 175.5 77.0156 167.5Z" 
          fill="#F5BF45"
        />
        <path 
          ref={pinkBubbleRef}
          d="M137.999 169V63C137.665 59.5 142.999 56 166.999 70C189.399 66.8 201.332 46 204.499 36C211.699 29.6 214.832 35 215.499 38.5C211.099 66.5 189.999 82.1667 179.999 86.5C189.199 107.7 180.499 131.667 174.999 141C174.199 145.8 174.665 148.333 174.999 149L186.499 170C187.699 172.4 185.665 172.333 184.499 172C165.699 162.8 158.999 162.833 157.999 164L143.499 172C139.899 173.6 138.332 170.667 137.999 169Z" 
          fill="#EF859F"
        />
        {/* White highlights - static */}
        <path 
          d="M62.207 44C63.6668 50.8704 58.9733 57.8034 51.5781 59.5918C44.183 61.3799 36.8407 57.3573 35 50.5791L37.6094 49.9473C39.104 54.0525 43.1903 57 48 57C54.0751 57 59 52.299 59 46.5C59 45.9244 58.9488 45.36 58.8555 44.8096L62.207 44Z" 
          fill="white"
        />
        <path 
          d="M119.75 31C118.322 39.513 110.919 46 102 46C93.0811 46 85.6783 39.513 84.25 31H119.75Z" 
          fill="white"
        />
        <path 
          d="M145.071 28.4209C145.787 36.0388 152.2 42 160.005 42C166.318 42 171.719 38.1 173.933 32.5781C173.977 33.0462 174 33.5204 174 34C174 42.2843 167.284 49 159 49C150.716 49 144 42.2843 144 34C144 32.0284 144.38 30.1454 145.071 28.4209Z" 
          fill="white"
        />
      </svg>
    </div>
  )
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  text,
  variant = 'default'
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {variant === 'logo' ? (
        <CollaboSpeakLogo size={size} />
      ) : (
        <div
          className={cn(
            'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
            sizeClasses[size]
          )}
        />
      )}
      {text && (
        <span className="text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  )
}

interface PageLoadingProps {
  message?: string
  variant?: 'default' | 'logo'
}

export function PageLoading({ 
  message = 'Loading...', 
  variant = 'logo' 
}: PageLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <LoadingSpinner size="lg" variant={variant} />
        <p className="mt-4 text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

interface InlineLoadingProps {
  message?: string
  className?: string
  variant?: 'default' | 'logo'
}

export function InlineLoading({ 
  message = 'Loading...', 
  className,
  variant = 'default'
}: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center justify-center py-8', className)}>
      <LoadingSpinner text={message} variant={variant} />
    </div>
  )
}
