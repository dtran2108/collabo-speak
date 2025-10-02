'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { User, LogIn, LogOut } from 'lucide-react'
import Image from 'next/image'

export function Navbar() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSignIn = () => {
    router.push('/login')
  }

  const handleProfile = () => {
    router.push('/dashboard')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-12 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Image
                src="/logos/CollaboSpeak.svg"
                alt="CollaboSpeak"
                width={30}
                height={30}
              />
              <span className='text-xl font-bold text-foreground"'>
                CollaboSpeak
              </span>
            </div>
          </Link>

          {/* Right side navigation */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span className="text-sm text-muted-foreground">
                  Loading...
                </span>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleProfile}
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleSignIn}
                className="flex items-center space-x-2"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
