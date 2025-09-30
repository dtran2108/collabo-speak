'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/database'
import { auth } from '@/lib/auth'
import type { UserSession, Session } from '@/types/database'

export function useUserSessions() {
  const [userSessions, setUserSessions] = useState<UserSession[]>([])
  const [currentUserSession, setCurrentUserSession] = useState<UserSession | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load user sessions
  const loadUserSessions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const user = await auth.getCurrentUser()
      if (!user) {
        setError('User not authenticated')
        return
      }

      const sessions = await db.userSessions.getByUserId(user.id)
      setUserSessions(sessions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user sessions')
    } finally {
      setLoading(false)
    }
  }

  // Load available sessions
  const loadSessions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const availableSessions = await db.sessions.getAll()
      setSessions(availableSessions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  // Create a new user session
  const createUserSession = async (sessionId: string, transcriptUrl?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const user = await auth.getCurrentUser()
      if (!user) {
        setError('User not authenticated')
        return null
      }

      const userSession = await db.userSessions.create({
        userId: user.id,
        sessionId,
        transcriptUrl
      })

      if (userSession) {
        setUserSessions(prev => [userSession, ...prev])
        setCurrentUserSession(userSession)
      }

      return userSession
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user session')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Update user session
  const updateUserSession = async (id: string, updates: { transcriptUrl?: string }) => {
    try {
      const updatedUserSession = await db.userSessions.update(id, updates)
      
      if (updatedUserSession) {
        setUserSessions(prev => 
          prev.map(session => 
            session.id === id ? updatedUserSession : session
          )
        )
        
        if (currentUserSession?.id === id) {
          setCurrentUserSession(updatedUserSession)
        }
      }

      return updatedUserSession
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user session')
      return null
    }
  }

  // Delete user session
  const deleteUserSession = async (id: string) => {
    try {
      const success = await db.userSessions.delete(id)
      
      if (success) {
        setUserSessions(prev => prev.filter(session => session.id !== id))
        
        if (currentUserSession?.id === id) {
          setCurrentUserSession(null)
        }
      }

      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user session')
      return false
    }
  }

  // Set current user session
  const setActiveUserSession = (userSession: UserSession) => {
    setCurrentUserSession(userSession)
  }

  // Load data on mount
  useEffect(() => {
    loadUserSessions()
    loadSessions()
  }, [])

  return {
    userSessions,
    currentUserSession,
    sessions,
    loading,
    error,
    loadUserSessions,
    loadSessions,
    createUserSession,
    updateUserSession,
    deleteUserSession,
    setActiveUserSession
  }
}
