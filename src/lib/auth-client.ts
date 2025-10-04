import type { User } from '@supabase/supabase-js'

export type AuthUser = User

// Store the current session token
let currentToken: string | null = null

export const authClient = {
  // Get current user from server
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      if (!currentToken) {
        return null
      }

      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        currentToken = null
        return null
      }

      const { user } = await response.json()
      return user
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (response.ok && result.data?.session?.access_token) {
        currentToken = result.data.session.access_token
        return { data: result.data, error: null }
      } else {
        return { data: null, error: result.error }
      }
    } catch (error) {
      console.error('Error signing in:', error)
      return { data: null, error: 'Network error' }
    }
  },

  // Sign out
  async signOut() {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      })

      currentToken = null
      
      if (response.ok) {
        return { error: null }
      } else {
        const result = await response.json()
        return { error: result.error }
      }
    } catch (error) {
      console.error('Error signing out:', error)
      currentToken = null
      return { error: 'Network error' }
    }
  },

  // Get session for API calls
  async getSession() {
    return {
      data: {
        session: currentToken ? { access_token: currentToken } : null
      }
    }
  },

  // Set token (for auth state management)
  setToken(token: string | null) {
    currentToken = token
  },

  // Get current token
  getToken() {
    return currentToken
  }
}
