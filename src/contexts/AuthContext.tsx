'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authClient, type AuthUser } from '@/lib/auth-client'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ data: { session: { access_token: string } } | null; error: string | null }>
  signOut: () => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        // Check if there's a stored token
        const storedToken = localStorage.getItem('auth_token')
        if (storedToken) {
          authClient.setToken(storedToken)
          const currentUser = await authClient.getCurrentUser()
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        localStorage.removeItem('auth_token')
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const result = await authClient.signIn(email, password)
      
      if (result.data && result.data.session?.access_token) {
        // Store token in localStorage
        localStorage.setItem('auth_token', result.data.session.access_token)
        authClient.setToken(result.data.session.access_token)
        
        // Get user info
        const currentUser = await authClient.getCurrentUser()
        setUser(currentUser)
      }
      
      return result
    } catch (error) {
      console.error('Sign in error:', error)
      return { data: null, error: 'Sign in failed' }
    }
  }

  const signOut = async () => {
    try {
      const result = await authClient.signOut()
      
      // Clear token and user
      localStorage.removeItem('auth_token')
      authClient.setToken(null)
      setUser(null)
      
      return result
    } catch (error) {
      console.error('Sign out error:', error)
      return { error: 'Sign out failed' }
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
