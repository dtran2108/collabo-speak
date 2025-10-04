'use client'

import { useState, useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import type { SessionToUser, Session } from '@/types/database'

export function useSessionToUser() {
  const [participationLog, setParticipationLog] = useState<SessionToUser[]>([])
  const [currentUserSession, setCurrentUserSession] = useState<SessionToUser | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load user sessions
  const loadParticipationLog = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { session } } = await authClient.getSession()
      if (!session?.access_token) {
        setError('User not authenticated')
        return
      }

      const response = await fetch('/api/session-to-user', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user sessions')
      }

      const result = await response.json()
      setParticipationLog(result.sessionToUser || [])
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
      const response = await fetch('/api/sessions')

      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const result = await response.json()
      setSessions(result.sessions || [])
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
      const { data: { session } } = await authClient.getSession()
      if (!session?.access_token) {
        setError('User not authenticated')
        return null
      }

      const response = await fetch('/api/session-to-user', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          transcriptUrl,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create user session')
      }

      const result = await response.json()
      const userSession = result.userSession

      if (userSession) {
        setParticipationLog(prev => [userSession, ...prev])
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
      const { data: { session } } = await authClient.getSession()
      if (!session?.access_token) {
        setError('User not authenticated')
        return null
      }

      const response = await fetch(`/api/session-to-user/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update user session')
      }

      const result = await response.json()
      const updatedUserSession = result.userSession
      
      if (updatedUserSession) {
        setParticipationLog(prev => 
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
      const { data: { session } } = await authClient.getSession()
      if (!session?.access_token) {
        setError('User not authenticated')
        return false
      }

      const response = await fetch(`/api/session-to-user/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete user session')
      }

      const result = await response.json()
      const success = result.success
      
      if (success) {
        setParticipationLog(prev => prev.filter(session => session.id !== id))
        
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
  const setActiveUserSession = (userSession: SessionToUser) => {
    setCurrentUserSession(userSession)
  }

  // Load data on mount
  useEffect(() => {
    loadParticipationLog()
    loadSessions()
  }, [])

  return {
    participationLog,
    currentUserSession,
    sessions,
    loading,
    error,
    loadParticipationLog,
    loadSessions,
    createUserSession,
    updateUserSession,
    deleteUserSession,
    setActiveUserSession
  }
}
