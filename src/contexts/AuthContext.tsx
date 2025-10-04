'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authClient, type AuthUser } from '@/lib/auth-client'

interface UserProfile {
  id: string
  email: string
  isAdmin: boolean
  roles: string[]
  permissions: string[]
}

interface AuthContextType {
  user: AuthUser | null
  userProfile: UserProfile | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ data: { session: { access_token: string } } | null; error: string | null }>
  signOut: () => Promise<{ error: string | null }>
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Function to fetch user profile with roles and admin status
  const fetchUserProfile = async (userId: string, token: string): Promise<UserProfile | null> => {
    try {
      const response = await fetch('/api/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        return {
          id: userId,
          email: user?.email || '',
          isAdmin: data.isAdmin || false,
          roles: data.roles?.map((role: any) => role.role.name) || [],
          permissions: data.permissions || []
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
    return null
  }

  // Function to refresh user profile
  const refreshUserProfile = async () => {
    if (!user) {
      setUserProfile(null)
      return
    }

    try {
      const { data: { session } } = await authClient.getSession()
      if (session?.access_token) {
        const profile = await fetchUserProfile(user.id, session.access_token)
        setUserProfile(profile)
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error)
    }
  }

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
          
          // Fetch user profile with roles
          if (currentUser) {
            const profile = await fetchUserProfile(currentUser.id, storedToken)
            setUserProfile(profile)
          }
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
        
        // Fetch user profile with roles
        if (currentUser) {
          const profile = await fetchUserProfile(currentUser.id, result.data.session.access_token)
          setUserProfile(profile)
        }
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
      
      // Clear token, user, and profile
      localStorage.removeItem('auth_token')
      authClient.setToken(null)
      setUser(null)
      setUserProfile(null)
      
      return result
    } catch (error) {
      console.error('Sign out error:', error)
      return { error: 'Sign out failed' }
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    isAdmin: userProfile?.isAdmin || false,
    signIn,
    signOut,
    refreshUserProfile
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
