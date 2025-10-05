'use client'

import React, {
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AdminDataTable, SortableHeader } from '../AdminDataTable'
import { PaginationState, FilterConfig } from '../helpers'
import { useAdminTable } from '@/hooks/useAdminTable'
import { Edit, Trash2 } from 'lucide-react'

// Persona interface
export interface Persona {
  id: string
  createdAt: string
  name: string
  description: string
  sessionId: string
  sessionName: string
  avatarUrl: string
}

// Props for the PersonasTable component
export interface PersonasTableProps {
  onAddPersona?: () => void
  onEditPersona?: (personaId: string, persona: Persona) => void
  onDeletePersona?: (personaId: string, personaName: string) => void
  fetchData: (params: {
    page: number
    limit: number
    search: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
    sessionId?: string
  }) => Promise<{ data: Persona[]; pagination: PaginationState }>
}

// Ref interface for exposing refetch function
export interface PersonasTableRef {
  refetch: () => Promise<void>
}

const PersonasTableComponent = forwardRef<PersonasTableRef, PersonasTableProps>(
  ({ onAddPersona, onEditPersona, onDeletePersona, fetchData }, ref) => {
    // State for sessions data
    const [sessions, setSessions] = useState<{ id: string; name: string }[]>([])
    console.log('DEBUG ~ sessions:', sessions)
    const [sessionsLoading, setSessionsLoading] = useState(false)

    // Fetch sessions for filter
    const fetchSessions = useCallback(async () => {
      try {
        setSessionsLoading(true)

        // Get auth token
        const { authClient } = await import('@/lib/auth-client')
        const {
          data: { session },
        } = await authClient.getSession()

        if (!session?.access_token) {
          throw new Error('No valid session found')
        }

        const response = await fetch('/api/admin/sessions?limit=1000', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setSessions(data.sessions || [])
        } else {
          console.error('Failed to fetch sessions:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching sessions:', error)
      } finally {
        setSessionsLoading(false)
      }
    }, [])

    // Fetch sessions on component mount
    useEffect(() => {
      fetchSessions()
    }, [fetchSessions])

    // Map frontend column names to API field names
    const mapColumnToApiField = (columnId: string): string => {
      const mapping: Record<string, string> = {
        createdAt: 'created_at',
        sessionId: 'sessionId',
      }
      return mapping[columnId] || columnId
    }

    // Create a wrapper function for fetchData
    const fetchPersonasWithMapping = useCallback(
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

        return fetchData(mappedParams)
      },
      [fetchData],
    )

    // Use the admin table hook
    const {
      data: personas,
      loading,
      error,
      pagination,
      sorting,
      search,
      filter: sessionFilter,
      handlePaginationChange,
      handleSortingChange,
      handleSearchChange,
      handleFilterChange: handleSessionFilterChange,
      refetch,
    } = useAdminTable({
      fetchData: fetchPersonasWithMapping,
      filterKey: 'sessionId',
      initialLimit: 10,
      initialSorting: [{ id: 'createdAt', desc: true }],
    })

    // Expose refetch function to parent component
    useImperativeHandle(
      ref,
      () => ({
        refetch,
      }),
      [refetch],
    )

    // Create dynamic filters configuration
    const filters: FilterConfig[] = useMemo(() => {
      const sessionFilterConfig: FilterConfig = {
        id: 'sessionId',
        label: 'Session',
        type: 'select',
        options: sessions.map((session) => ({
          id: session.id,
          name: session.name,
        })),
        value: sessionFilter || 'all',
        onChange: handleSessionFilterChange,
        disabled: loading || sessionsLoading,
      }

      return [sessionFilterConfig]
    }, [
      sessionFilter,
      handleSessionFilterChange,
      loading,
      sessionsLoading,
      sessions,
    ])

    // Handle edit button click
    const handleEditClick = useCallback(
      (personaId: string, persona: Persona) => {
        onEditPersona?.(personaId, persona)
      },
      [onEditPersona],
    )

    // Handle delete button click
    const handleDeleteClick = useCallback(
      (personaId: string, personaName: string) => {
        onDeletePersona?.(personaId, personaName)
      },
      [onDeletePersona],
    )

    // Handle add persona button click
    const handleAddPersonaClick = useCallback(() => {
      onAddPersona?.()
    }, [onAddPersona])

    // Define columns
    const columns: ColumnDef<Persona>[] = useMemo(
      () => [
        {
          accessorKey: 'id',
          header: ({ column }) => (
            <SortableHeader column={column}>Persona ID</SortableHeader>
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
          cell: ({ row }) => {
            const persona = row.original
            return (
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage
                    src={persona.avatarUrl}
                    alt={`${persona.name} avatar`}
                  />
                  <AvatarFallback className="text-xs font-medium">
                    {persona.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="font-medium">{persona.name}</div>
              </div>
            )
          },
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
          accessorKey: 'sessionName',
          header: ({ column }) => (
            <SortableHeader column={column}>Session Name</SortableHeader>
          ),
          enableSorting: true,
          size: 200,
          cell: ({ row }) => (
            <div className="text-sm">{row.getValue('sessionName')}</div>
          ),
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
      <AdminDataTable
        data={personas}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by persona name..."
        filters={filters}
        onAddItem={handleAddPersonaClick}
        addButtonText="Add Persona"
        emptyStateMessage="No personas found."
      />
    )
  },
)

PersonasTableComponent.displayName = 'PersonasTable'

export const PersonasTable = PersonasTableComponent
