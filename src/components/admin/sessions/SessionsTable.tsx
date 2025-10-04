'use client'

import React, { useMemo, useCallback, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdminDataTable, SortableHeader } from '../AdminDataTable'
import { PaginationState, FilterConfig } from '../helpers'
import { useAdminTable } from '@/hooks/useAdminTable'
import { authClient } from '@/lib/auth-client'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { AddSessionModal } from './add-session-modal'
import { SessionForm } from './session-form'
import { Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

// Session interface
export interface Session {
  id: string
  createdAt: string
  name: string
  description: string
  agentId: string
  isReady: boolean
}

// Props for the SessionsTable component
export interface SessionsTableProps {
  onAddSession?: () => void
  onEditSession?: (sessionId: string) => void
  onDeleteSession?: (sessionId: string) => void
}

// API function to fetch sessions
async function fetchSessions(params: {
  page: number
  limit: number
  search: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  isReady?: string
}): Promise<{ data: Session[]; pagination: PaginationState }> {
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

  // Transform API response to match useAdminTable expected format
  const transformedResult = {
    data: result.sessions,
    pagination: result.pagination,
  }

  return transformedResult
}

export function SessionsTable({
  onAddSession,
  onEditSession,
  onDeleteSession,
}: SessionsTableProps) {
  // Delete confirmation modal state
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

  // Add session modal state
  const [addSessionModal, setAddSessionModal] = useState<{
    isOpen: boolean
    isLoading: boolean
  }>({
    isOpen: false,
    isLoading: false,
  })

  // Update session modal state
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

  // Map frontend column names to API field names
  const mapColumnToApiField = (columnId: string): string => {
    const mapping: Record<string, string> = {
      createdAt: 'created_at',
      agentId: 'agentId',
      isReady: 'isReady',
    }
    return mapping[columnId] || columnId
  }

  // Create a wrapper function for fetchSessions
  const fetchSessionsWithMapping = useCallback(
    (params: {
      page: number
      limit: number
      search: string
      sortBy: string
      sortOrder: 'asc' | 'desc'
      [key: string]: unknown
    }) => {
      // Map the sortBy field to API field name
      const mappedParams = {
        ...params,
        sortBy: mapColumnToApiField(params.sortBy),
      }

      return fetchSessions(mappedParams)
    },
    [],
  )

  // Use the admin table hook
  const {
    data: sessions,
    loading,
    error,
    pagination,
    sorting,
    search,
    filter: isReadyFilter,
    handlePaginationChange,
    handleSortingChange,
    handleSearchChange,
    handleFilterChange: handleIsReadyFilterChange,
    refetch: loadData,
  } = useAdminTable({
    fetchData: fetchSessionsWithMapping,
    filterKey: 'isReady',
    initialLimit: 10,
    initialSorting: [{ id: 'createdAt', desc: true }],
  })

  // Create dynamic filters configuration
  const filters: FilterConfig[] = useMemo(() => {
    const isReadyFilterConfig: FilterConfig = {
      id: 'isReady',
      label: 'Status',
      type: 'select',
      options: [
        { id: 'true', name: 'Ready' },
        { id: 'false', name: 'Not Ready' },
      ],
      value: isReadyFilter || 'all',
      onChange: handleIsReadyFilterChange,
      disabled: loading,
      width: 'w-full sm:w-48',
    }

    return [isReadyFilterConfig]
  }, [isReadyFilter, handleIsReadyFilterChange, loading])

  // Delete session function
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

        // Close modal and refresh data
        setDeleteModal({
          isOpen: false,
          sessionId: null,
          sessionName: null,
          isLoading: false,
        })

        // Refresh the table data
        await loadData()

        // Call parent callback if provided
        onDeleteSession?.(sessionId)
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
    [loadData, onDeleteSession],
  )

  // Handle delete button click
  const handleDeleteClick = useCallback(
    (sessionId: string, sessionName: string) => {
      setDeleteModal({
        isOpen: true,
        sessionId,
        sessionName,
        isLoading: false,
      })
    },
    [],
  )

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(() => {
    if (deleteModal.sessionId) {
      deleteSession(deleteModal.sessionId)
    }
  }, [deleteModal.sessionId, deleteSession])

  // Handle delete modal close
  const handleDeleteCancel = useCallback(() => {
    setDeleteModal({
      isOpen: false,
      sessionId: null,
      sessionName: null,
      isLoading: false,
    })
  }, [])

  // Add session function
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

        // Close modal and refresh data
        setAddSessionModal({
          isOpen: false,
          isLoading: false,
        })

        // Refresh the table data
        await loadData()

        // Call parent callback if provided
        onAddSession?.()

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
    [loadData, onAddSession],
  )

  // Handle add session button click
  const handleAddSessionClick = useCallback(() => {
    setAddSessionModal({
      isOpen: true,
      isLoading: false,
    })
  }, [])

  // Handle add session modal close
  const handleAddSessionClose = useCallback(() => {
    setAddSessionModal({
      isOpen: false,
      isLoading: false,
    })
  }, [])

  // Update session function
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

        // Close modal and refresh data
        setUpdateSessionModal({
          isOpen: false,
          isLoading: false,
          sessionId: null,
          sessionData: null,
        })

        // Refresh the table data
        await loadData()

        // Call parent callback if provided
        onEditSession?.(updateSessionModal.sessionId)

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
    [updateSessionModal.sessionId, loadData, onEditSession],
  )

  // Handle edit button click
  const handleEditClick = useCallback((sessionId: string, session: Session) => {
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

  // Handle update session modal close
  const handleUpdateSessionClose = useCallback(() => {
    setUpdateSessionModal({
      isOpen: false,
      isLoading: false,
      sessionId: null,
      sessionData: null,
    })
  }, [])

  // Define columns
  const columns: ColumnDef<Session>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <SortableHeader column={column}>Session ID</SortableHeader>
        ),
        size: 200,
        cell: ({ row }) => (
          <div className="font-mono text-sm whitespace-nowrap">
            {row.getValue('id') as string}
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <SortableHeader column={column}>Created At</SortableHeader>
        ),
        enableSorting: true,
        size: 200,
        cell: ({ row }) => {
          const date = new Date(row.getValue('createdAt') as string)
          return (
            <div className="font-mono text-sm whitespace-nowrap">
              {date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
              })}{' '}
              {date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          )
        },
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <SortableHeader column={column}>Name</SortableHeader>
        ),
        enableSorting: true,
        size: 200,
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('name')}</div>
        ),
      },
      {
        accessorKey: 'description',
        header: ({ column }) => (
          <SortableHeader column={column}>Description</SortableHeader>
        ),
        enableSorting: false,
        size: 300,
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-xs truncate">
            {row.getValue('description')}
          </div>
        ),
      },
      {
        accessorKey: 'agentId',
        header: ({ column }) => (
          <SortableHeader column={column}>Agent ID</SortableHeader>
        ),
        enableSorting: true,
        size: 150,
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.getValue('agentId')}</div>
        ),
      },
      {
        accessorKey: 'isReady',
        header: ({ column }) => (
          <SortableHeader column={column}>Status</SortableHeader>
        ),
        enableSorting: true,
        size: 120,
        cell: ({ row }) => {
          const isReady = row.getValue('isReady') as boolean
          return (
            <Badge
              variant={isReady ? 'default' : 'secondary'}
              className={`text-xs ${
                isReady
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-gray-100 text-gray-800 border-gray-200'
              }`}
            >
              {isReady ? 'Ready' : 'Not Ready'}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: ({ column }) => (
          <SortableHeader column={column}>Actions</SortableHeader>
        ),
        enableSorting: false,
        size: 150,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditClick(row.original.id, row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleDeleteClick(row.original.id, row.original.name)
              }
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [handleEditClick, handleDeleteClick],
  )

  return (
    <>
      <AdminDataTable
        data={sessions}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by session name..."
        filters={filters}
        onAddItem={handleAddSessionClick}
        addButtonText="Add Session"
        emptyStateMessage="No sessions found."
      />

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
