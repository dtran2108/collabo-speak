'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/hooks/useAdmin'
import { History, LogIn, LogOut, Menu, X, Shield } from 'lucide-react'
import Image from 'next/image'

export function Navbar() {
  const { user, loading, signOut } = useAuth()
  const { isAdmin: isAdminUser, loading: adminLoading } = useAdmin()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
      setIsMobileMenuOpen(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSignIn = () => {
    router.push('/login')
    setIsMobileMenuOpen(false)
  }

  const handleSessionHistory = () => {
    router.push('/session-history')
    setIsMobileMenuOpen(false)
  }

  const handleAdmin = () => {
    router.push('/admin')
    setIsMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
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
                  onClick={handleSessionHistory}
                  className="flex items-center space-x-2"
                >
                  <History className="h-4 w-4" />
                  <span>Session History</span>
                </Button>
                {!adminLoading && isAdminUser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAdmin}
                    className="flex items-center space-x-2"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Button>
                )}
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

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {loading ? (
                <div className="flex items-center space-x-2 px-3 py-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  <span className="text-sm text-muted-foreground">
                    Loading...
                  </span>
                </div>
              ) : user ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSessionHistory}
                    className="w-full justify-start flex items-center space-x-2 px-3 py-2"
                  >
                    <History className="h-4 w-4" />
                    <span>Session History</span>
                  </Button>
                  {!adminLoading && isAdminUser && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAdmin}
                      className="w-full justify-start flex items-center space-x-2 px-3 py-2"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full justify-start flex items-center space-x-2 px-3 py-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSignIn}
                  className="w-full justify-start flex items-center space-x-2 px-3 py-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
