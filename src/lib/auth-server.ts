import { supabase } from '@/app/api/lib/supabase'
import type { User } from '@supabase/supabase-js'

export type AuthUser = User

export const authServer = {
  // Get current user from token
  async getCurrentUser(token: string): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (error || !user) {
        return null
      }
      return user as AuthUser
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  // Sign in with email and password (server-side)
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { data, error }
    } catch (error) {
      console.error('Error signing in:', error)
      return { data: null, error }
    }
  },

  // Sign out (server-side)
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('Error signing out:', error)
      return { error }
    }
  }
}
