'use client'

import React, { useMemo, useCallback, forwardRef, useImperativeHandle } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdminDataTable, SortableHeader } from '../AdminDataTable'
import { PaginationState, FilterConfig } from '../helpers'
import { useAdminTable } from '@/hooks/useAdminTable'
import { Edit, Trash2 } from 'lucide-react'

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
  onEditSession?: (sessionId: string, session: Session) => void
  onDeleteSession?: (sessionId: string, sessionName: string) => void
  fetchData: (params: {
    page: number
    limit: number
    search: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
    isReady?: string
  }) => Promise<{ data: Session[]; pagination: PaginationState }>
}

// Ref interface for exposing refetch function
export interface SessionsTableRef {
  refetch: () => Promise<void>
}

const SessionsTableComponent = forwardRef<SessionsTableRef, SessionsTableProps>(({
  onAddSession,
  onEditSession,
  onDeleteSession,
  fetchData,
}, ref) => {

  // Map frontend column names to API field names
  const mapColumnToApiField = (columnId: string): string => {
    const mapping: Record<string, string> = {
      createdAt: 'created_at',
      agentId: 'agentId',
      isReady: 'isReady',
    }
    return mapping[columnId] || columnId
  }

  // Create a wrapper function for fetchData
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

      return fetchData(mappedParams)
    },
    [fetchData],
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
    refetch,
  } = useAdminTable({
    fetchData: fetchSessionsWithMapping,
    filterKey: 'isReady',
    initialLimit: 10,
    initialSorting: [{ id: 'createdAt', desc: true }],
  })

  // Expose refetch function to parent component
  useImperativeHandle(ref, () => ({
    refetch,
  }), [refetch])

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

  // Handle edit button click
  const handleEditClick = useCallback((sessionId: string, session: Session) => {
    onEditSession?.(sessionId, session)
  }, [onEditSession])

  // Handle delete button click
  const handleDeleteClick = useCallback((sessionId: string, sessionName: string) => {
    onDeleteSession?.(sessionId, sessionName)
  }, [onDeleteSession])

  // Handle add session button click
  const handleAddSessionClick = useCallback(() => {
    onAddSession?.()
  }, [onAddSession])

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
  )
})

SessionsTableComponent.displayName = 'SessionsTable'

export const SessionsTable = SessionsTableComponent
