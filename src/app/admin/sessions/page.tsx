'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { SessionsTable, Session, SessionsTableRef } from '@/components/admin/sessions/SessionsTable'
import { authClient } from '@/lib/auth-client'
import { PageLoading } from '@/components/ui/loading-spinner'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { AddSessionModal } from '@/components/admin/sessions/add-session-modal'
import { SessionForm } from '@/components/admin/sessions/session-form'
import { toast } from 'sonner'

export default function AdminSessionsPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const sessionsTableRef = useRef<SessionsTableRef>(null)

  // Modal state management
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    sessionId: string | null
    sessionName: string | null
    isLoading: boolean
  }>({
    isOpen: false,
    sessionId: null,
    sessionName: null,
    isLoading: false,
  })

  const [addSessionModal, setAddSessionModal] = useState<{
    isOpen: boolean
    isLoading: boolean
  }>({
    isOpen: false,
    isLoading: false,
  })

  const [updateSessionModal, setUpdateSessionModal] = useState<{
    isOpen: boolean
    isLoading: boolean
    sessionId: string | null
    sessionData: {
      name: string
      description: string
      agentId: string
      isReady: boolean
    } | null
  }>({
    isOpen: false,
    isLoading: false,
    sessionId: null,
    sessionData: null,
  })

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    if (!loading && user && !isAdmin) {
      router.push('/dashboard')
      return
    }
  }, [user, loading, isAdmin, router])

  // API function to fetch sessions
  const fetchSessions = useCallback(
    async (params: {
      page: number
      limit: number
      search: string
      sortBy: string
      sortOrder: 'asc' | 'desc'
      isReady?: string
    }) => {
      const {
        data: { session },
      } = await authClient.getSession()

      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      const searchParams = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString(),
        search: params.search,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      })

      if (params.isReady !== undefined) {
        searchParams.set('isReady', params.isReady)
      }

      const response = await fetch(`/api/admin/sessions?${searchParams}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const result = await response.json()

      return {
        data: result.sessions,
        pagination: result.pagination,
      }
    },
    [],
  )

  // CRUD Functions
  const addSession = useCallback(
    async (sessionData: {
      name: string
      description: string
      agentId: string
      isReady: boolean
    }) => {
      try {
        setAddSessionModal((prev) => ({ ...prev, isLoading: true }))

        const {
          data: { session },
        } = await authClient.getSession()

        if (!session?.access_token) {
          throw new Error('No valid session found')
        }

        const response = await fetch('/api/admin/sessions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sessionData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create session')
        }

        const result = await response.json()
        console.log('Session created successfully:', result)

        // Close modal
        setAddSessionModal({
          isOpen: false,
          isLoading: false,
        })

        // Refresh the table data
        await sessionsTableRef.current?.refetch()

        // Show success message
        toast.success(`Session "${sessionData.name}" created successfully!`)
      } catch (error) {
        console.error('Error creating session:', error)
        setAddSessionModal((prev) => ({ ...prev, isLoading: false }))
        toast.error(
          `Error creating session: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        )
      }
    },
    [],
  )

  const updateSession = useCallback(
    async (sessionData: {
      name: string
      description: string
      agentId: string
      isReady: boolean
    }) => {
      if (!updateSessionModal.sessionId) return

      try {
        setUpdateSessionModal((prev) => ({ ...prev, isLoading: true }))

        const {
          data: { session },
        } = await authClient.getSession()

        if (!session?.access_token) {
          throw new Error('No valid session found')
        }

        const response = await fetch(
          `/api/admin/sessions/${updateSessionModal.sessionId}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(sessionData),
          },
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update session')
        }

        const result = await response.json()
        console.log('Session updated successfully:', result)

        // Close modal
        setUpdateSessionModal({
          isOpen: false,
          isLoading: false,
          sessionId: null,
          sessionData: null,
        })

        // Refresh the table data
        await sessionsTableRef.current?.refetch()

        // Show success message
        toast.success(`Session updated successfully!`)
      } catch (error) {
        console.error('Error updating session:', error)
        setUpdateSessionModal((prev) => ({ ...prev, isLoading: false }))
        toast.error(
          `Error updating session: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        )
      }
    },
    [updateSessionModal.sessionId],
  )

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        setDeleteModal((prev) => ({ ...prev, isLoading: true }))

        const {
          data: { session },
        } = await authClient.getSession()

        if (!session?.access_token) {
          throw new Error('No valid session found')
        }

        const response = await fetch(`/api/admin/sessions/${sessionId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete session')
        }

        const result = await response.json()
        console.log('Session deleted successfully:', result)

        // Close modal
        setDeleteModal({
          isOpen: false,
          sessionId: null,
          sessionName: null,
          isLoading: false,
        })

        // Refresh the table data
        await sessionsTableRef.current?.refetch()

        // Show success message
        toast.success('Session deleted successfully!')
      } catch (error) {
        console.error('Error deleting session:', error)
        setDeleteModal((prev) => ({ ...prev, isLoading: false }))
        toast.error(
          `Error deleting session: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        )
      }
    },
    [],
  )

  // Event handlers
  const handleAddSession = useCallback(() => {
    setAddSessionModal({
      isOpen: true,
      isLoading: false,
    })
  }, [])

  const handleEditSession = useCallback((sessionId: string, session: Session) => {
    setUpdateSessionModal({
      isOpen: true,
      isLoading: false,
      sessionId,
      sessionData: {
        name: session.name,
        description: session.description,
        agentId: session.agentId,
        isReady: session.isReady,
      },
    })
  }, [])

  const handleDeleteSession = useCallback((sessionId: string, sessionName: string) => {
    setDeleteModal({
      isOpen: true,
      sessionId,
      sessionName,
      isLoading: false,
    })
  }, [])

  // Modal handlers
  const handleAddSessionClose = useCallback(() => {
    setAddSessionModal({
      isOpen: false,
      isLoading: false,
    })
  }, [])

  const handleUpdateSessionClose = useCallback(() => {
    setUpdateSessionModal({
      isOpen: false,
      isLoading: false,
      sessionId: null,
      sessionData: null,
    })
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (deleteModal.sessionId) {
      deleteSession(deleteModal.sessionId)
    }
  }, [deleteModal.sessionId, deleteSession])

  const handleDeleteCancel = useCallback(() => {
    setDeleteModal({
      isOpen: false,
      sessionId: null,
      sessionName: null,
      isLoading: false,
    })
  }, [])

  // Only show page-level loading for auth, not for data fetching
  if (loading) {
    return <PageLoading />
  }

  return (
    <>
      <div className="w-full max-w-full lg:max-w-[80vw] overflow-hidden">
        <SessionsTable
          ref={sessionsTableRef}
          onAddSession={handleAddSession}
          onEditSession={handleEditSession}
          onDeleteSession={handleDeleteSession}
          fetchData={fetchSessions}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Session"
        description={
          <>
            <p>You are deleting this session:</p>
            <strong className="text-orange-500">
              {deleteModal.sessionName}
            </strong>
            <p className="mt-2">
              This action cannot be undone and will permanently remove the
              session. Note: Sessions with existing participation logs or
              personas cannot be deleted.
            </p>
          </>
        }
        confirmText="Delete Session"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteModal.isLoading}
      />

      {/* Add Session Modal */}
      <AddSessionModal
        isOpen={addSessionModal.isOpen}
        onClose={handleAddSessionClose}
        onSubmit={addSession}
        isLoading={addSessionModal.isLoading}
      />

      {/* Update Session Modal */}
      {updateSessionModal.sessionData && (
        <SessionForm
          isOpen={updateSessionModal.isOpen}
          onClose={handleUpdateSessionClose}
          onSubmit={updateSession}
          isLoading={updateSessionModal.isLoading}
          mode="update"
          initialData={updateSessionModal.sessionData}
        />
      )}
    </>
  )
}
