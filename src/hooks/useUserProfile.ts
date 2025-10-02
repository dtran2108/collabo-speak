import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import type { UserProfile, UserProfileInsert, UserProfileUpdate } from '@/types/database'

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load user profile
  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const { profile: userProfile } = await api.userProfiles.get()
      setProfile(userProfile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Create user profile
  const createProfile = useCallback(async (profileData: UserProfileInsert) => {
    try {
      setLoading(true)
      setError(null)
      const { profile: newProfile } = await api.userProfiles.create(profileData)
      setProfile(newProfile)
      return newProfile
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Update user profile
  const updateProfile = useCallback(async (updates: UserProfileUpdate) => {
    try {
      setLoading(true)
      setError(null)
      const { profile: updatedProfile } = await api.userProfiles.update(updates)
      setProfile(updatedProfile)
      return updatedProfile
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Load profile when user changes
  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  return {
    profile,
    loading,
    error,
    loadProfile,
    createProfile,
    updateProfile,
  }
}
