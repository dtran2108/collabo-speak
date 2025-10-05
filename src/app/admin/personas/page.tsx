'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { PersonasTable, Persona, PersonasTableRef } from '@/components/admin/personas/PersonasTable'
import { authClient } from '@/lib/auth-client'
import { PageLoading } from '@/components/ui/loading-spinner'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { AddPersonaModal } from '@/components/admin/personas/add-persona-modal'
import { PersonaForm } from '@/components/admin/personas/persona-form'
import { toast } from 'sonner'

export default function AdminPersonasPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const personasTableRef = useRef<PersonasTableRef>(null)

  // Modal state management
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    personaId: string | null
    personaName: string | null
    isLoading: boolean
  }>({
    isOpen: false,
    personaId: null,
    personaName: null,
    isLoading: false,
  })

  const [addPersonaModal, setAddPersonaModal] = useState<{
    isOpen: boolean
    isLoading: boolean
  }>({
    isOpen: false,
    isLoading: false,
  })

  const [updatePersonaModal, setUpdatePersonaModal] = useState<{
    isOpen: boolean
    isLoading: boolean
    personaId: string | null
    personaData: {
      name: string
      description: string
      sessionId: string
      avatarUrl: string
    } | null
  }>({
    isOpen: false,
    isLoading: false,
    personaId: null,
    personaData: null,
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

  // API function to fetch personas
  const fetchPersonas = useCallback(
    async (params: {
      page: number
      limit: number
      search: string
      sortBy: string
      sortOrder: 'asc' | 'desc'
      sessionId?: string
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

      if (params.sessionId !== undefined) {
        searchParams.set('sessionId', params.sessionId)
      }

      const response = await fetch(`/api/admin/personas?${searchParams}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch personas')
      }

      const result = await response.json()

      return {
        data: result.personas,
        pagination: result.pagination,
      }
    },
    [],
  )

  // CRUD Functions
  const addPersona = useCallback(
    async (personaData: {
      name: string
      description: string
      sessionId: string
      avatarUrl?: string
    }) => {
      try {
        setAddPersonaModal((prev) => ({ ...prev, isLoading: true }))

        const {
          data: { session },
        } = await authClient.getSession()

        if (!session?.access_token) {
          throw new Error('No valid session found')
        }

        const response = await fetch('/api/admin/personas', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(personaData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create persona')
        }

        const result = await response.json()
        console.log('Persona created successfully:', result)

        // Close modal
        setAddPersonaModal({
          isOpen: false,
          isLoading: false,
        })

        // Refresh the table data
        await personasTableRef.current?.refetch()

        // Show success message
        toast.success(`Persona "${personaData.name}" created successfully!`)
      } catch (error) {
        console.error('Error creating persona:', error)
        setAddPersonaModal((prev) => ({ ...prev, isLoading: false }))
        toast.error(
          `Error creating persona: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        )
      }
    },
    [],
  )

  const updatePersona = useCallback(
    async (personaData: {
      name: string
      description: string
      sessionId: string
      avatarUrl?: string
    }) => {
      if (!updatePersonaModal.personaId) return

      try {
        setUpdatePersonaModal((prev) => ({ ...prev, isLoading: true }))

        const {
          data: { session },
        } = await authClient.getSession()

        if (!session?.access_token) {
          throw new Error('No valid session found')
        }

        const response = await fetch(
          `/api/admin/personas/${updatePersonaModal.personaId}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(personaData),
          },
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update persona')
        }

        const result = await response.json()
        console.log('Persona updated successfully:', result)

        // Close modal
        setUpdatePersonaModal({
          isOpen: false,
          isLoading: false,
          personaId: null,
          personaData: null,
        })

        // Refresh the table data
        await personasTableRef.current?.refetch()

        // Show success message
        toast.success(`Persona updated successfully!`)
      } catch (error) {
        console.error('Error updating persona:', error)
        setUpdatePersonaModal((prev) => ({ ...prev, isLoading: false }))
        toast.error(
          `Error updating persona: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        )
      }
    },
    [updatePersonaModal.personaId],
  )

  const deletePersona = useCallback(
    async (personaId: string) => {
      try {
        setDeleteModal((prev) => ({ ...prev, isLoading: true }))

        const {
          data: { session },
        } = await authClient.getSession()

        if (!session?.access_token) {
          throw new Error('No valid session found')
        }

        const response = await fetch(`/api/admin/personas/${personaId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete persona')
        }

        const result = await response.json()
        console.log('Persona deleted successfully:', result)

        // Close modal
        setDeleteModal({
          isOpen: false,
          personaId: null,
          personaName: null,
          isLoading: false,
        })

        // Refresh the table data
        await personasTableRef.current?.refetch()

        // Show success message
        toast.success('Persona deleted successfully!')
      } catch (error) {
        console.error('Error deleting persona:', error)
        setDeleteModal((prev) => ({ ...prev, isLoading: false }))
        toast.error(
          `Error deleting persona: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        )
      }
    },
    [],
  )

  // Event handlers
  const handleAddPersona = useCallback(() => {
    setAddPersonaModal({
      isOpen: true,
      isLoading: false,
    })
  }, [])

  const handleEditPersona = useCallback((personaId: string, persona: Persona) => {
    setUpdatePersonaModal({
      isOpen: true,
      isLoading: false,
      personaId,
      personaData: {
        name: persona.name,
        description: persona.description,
        sessionId: persona.sessionId,
        avatarUrl: persona.avatarUrl,
      },
    })
  }, [])

  const handleDeletePersona = useCallback((personaId: string, personaName: string) => {
    setDeleteModal({
      isOpen: true,
      personaId,
      personaName,
      isLoading: false,
    })
  }, [])

  // Modal handlers
  const handleAddPersonaClose = useCallback(() => {
    setAddPersonaModal({
      isOpen: false,
      isLoading: false,
    })
  }, [])

  const handleUpdatePersonaClose = useCallback(() => {
    setUpdatePersonaModal({
      isOpen: false,
      isLoading: false,
      personaId: null,
      personaData: null,
    })
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (deleteModal.personaId) {
      deletePersona(deleteModal.personaId)
    }
  }, [deleteModal.personaId, deletePersona])

  const handleDeleteCancel = useCallback(() => {
    setDeleteModal({
      isOpen: false,
      personaId: null,
      personaName: null,
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
        <PersonasTable
          ref={personasTableRef}
          onAddPersona={handleAddPersona}
          onEditPersona={handleEditPersona}
          onDeletePersona={handleDeletePersona}
          fetchData={fetchPersonas}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Persona"
        description={
          <>
            <p>You are deleting this persona:</p>
            <strong className="text-orange-500">
              {deleteModal.personaName}
            </strong>
            <p className="mt-2">
              This action cannot be undone and will permanently remove the
              persona from the system.
            </p>
          </>
        }
        confirmText="Delete Persona"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteModal.isLoading}
      />

      {/* Add Persona Modal */}
      <AddPersonaModal
        isOpen={addPersonaModal.isOpen}
        onClose={handleAddPersonaClose}
        onSubmit={addPersona}
        isLoading={addPersonaModal.isLoading}
      />

      {/* Update Persona Modal */}
      {updatePersonaModal.personaData && (
        <PersonaForm
          isOpen={updatePersonaModal.isOpen}
          onClose={handleUpdatePersonaClose}
          onSubmit={updatePersona}
          isLoading={updatePersonaModal.isLoading}
          mode="update"
          initialData={updatePersonaModal.personaData}
        />
      )}
    </>
  )
}