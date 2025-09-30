'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, type AuthUser } from '@/lib/auth'
import type { AuthResponse, AuthError } from '@supabase/supabase-js'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ data: AuthResponse['data']; error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ data: AuthResponse['data']; error: AuthError | null }>
  signInWithGoogle: () => Promise<{ data: { provider: string; url: string | null }; error: AuthError | null }>
  signInWithGitHub: () => Promise<{ data: { provider: string; url: string | null }; error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ data: Record<string, never> | null; error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const currentUser = await auth.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    return await auth.signIn(email, password)
  }

  const signUp = async (email: string, password: string) => {
    return await auth.signUp(email, password)
  }

  const signInWithGoogle = async () => {
    return await auth.signInWithGoogle()
  }

  const signInWithGitHub = async () => {
    return await auth.signInWithGitHub()
  }

  const signOut = async () => {
    return await auth.signOut()
  }

  const resetPassword = async (email: string) => {
    return await auth.resetPassword(email)
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    signOut,
    resetPassword
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
