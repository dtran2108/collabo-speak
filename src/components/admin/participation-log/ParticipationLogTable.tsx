'use client'

import React, {
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdminDataTable, SortableHeader } from '../AdminDataTable'
import { PaginationState, FilterConfig } from '../helpers'
import { useAdminTable } from '@/hooks/useAdminTable'
import { Eye } from 'lucide-react'

// ParticipationLog interface
export interface ParticipationLog {
  id: string
  createdAt: string
  sessionName: string
  userFullName: string
  transcriptUrl: string | null
  duration: string | null
  sessionId: string
  userId: string
  reflection: string | null
  user_question_or_feedback: string | null
  feedback: {
    strengths: string[]
    improvements: string[]
    tips: string[]
    big_picture_thinking: string[]
  } | null
  words_per_min: number | null
  filler_words_per_min: number | null
  participation_percentage: number | null
  pisa_shared_understanding: number | null
  pisa_problem_solving_action: number | null
  pisa_team_organization: number | null
}

// Props for the ParticipationLogTable component
export interface ParticipationLogTableProps {
  onViewDetails?: (participationLog: ParticipationLog) => void
  fetchData: (params: {
    page: number
    limit: number
    search: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
    sessionId?: string
  }) => Promise<{ data: ParticipationLog[]; pagination: PaginationState }>
  sessionOptions?: Array<{ id: string; name: string }>
}

// Ref interface for exposing refetch function
export interface ParticipationLogTableRef {
  refetch: () => Promise<void>
}

const ParticipationLogTableComponent = forwardRef<
  ParticipationLogTableRef,
  ParticipationLogTableProps
>(({ onViewDetails, fetchData, sessionOptions = [] }, ref) => {
  // Map frontend column names to API field names
  const mapColumnToApiField = (columnId: string): string => {
    const mapping: Record<string, string> = {
      createdAt: 'created_at',
      sessionName: 'session_name',
      userFullName: 'user_full_name',
      transcriptUrl: 'transcript_url',
    }
    return mapping[columnId] || columnId
  }

  // Create a wrapper function for fetchData
  const fetchParticipationLogsWithMapping = useCallback(
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
    data: participationLogs,
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
    fetchData: fetchParticipationLogsWithMapping,
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
      options: [
        ...sessionOptions.map((session) => ({
          id: session.id,
          name: session.name,
        })),
      ],
      value: sessionFilter || 'all',
      onChange: handleSessionFilterChange,
      disabled: loading,
      width: 'w-full sm:w-48',
    }

    return [sessionFilterConfig]
  }, [sessionFilter, handleSessionFilterChange, loading, sessionOptions])

  // Handle view details button click
  const handleViewDetailsClick = useCallback(
    (participationLog: ParticipationLog) => {
      onViewDetails?.(participationLog)
    },
    [onViewDetails],
  )

  // Define columns
  const columns: ColumnDef<ParticipationLog>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <SortableHeader column={column}>ID</SortableHeader>
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
        accessorKey: 'sessionName',
        header: ({ column }) => (
          <SortableHeader column={column}>Session Name</SortableHeader>
        ),
        enableSorting: true,
        size: 200,
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('sessionName')}</div>
        ),
      },
      {
        accessorKey: 'userFullName',
        header: ({ column }) => (
          <SortableHeader column={column}>User Full Name</SortableHeader>
        ),
        enableSorting: true,
        size: 200,
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('userFullName')}</div>
        ),
      },
      {
        accessorKey: 'transcriptUrl',
        header: ({ column }) => (
          <SortableHeader column={column}>Transcript</SortableHeader>
        ),
        enableSorting: false,
        size: 150,
        cell: ({ row }) => {
          const transcriptUrl = row.getValue('transcriptUrl') as string | null
          return (
            <div className="text-sm">
              {transcriptUrl ? (
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800 border-green-200"
                >
                  Available
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-800 border-gray-200"
                >
                  Not Available
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'duration',
        header: ({ column }) => (
          <SortableHeader column={column}>Duration</SortableHeader>
        ),
        enableSorting: true,
        size: 120,
        cell: ({ row }) => {
          const duration = row.getValue('duration') as string | null
          return <div className="text-sm font-mono">{duration || 'N/A'}</div>
        },
      },
      {
        id: 'actions',
        header: ({ column }) => (
          <SortableHeader column={column}>Actions</SortableHeader>
        ),
        enableSorting: false,
        size: 120,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewDetailsClick(row.original)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [handleViewDetailsClick],
  )

  return (
    <AdminDataTable
      data={participationLogs}
      columns={columns}
      loading={loading}
      error={error}
      pagination={pagination}
      onPaginationChange={handlePaginationChange}
      sorting={sorting}
      onSortingChange={handleSortingChange}
      searchValue={search}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search by session name or user name..."
      filters={filters}
      emptyStateMessage="No participation logs found."
    />
  )
})

ParticipationLogTableComponent.displayName = 'ParticipationLogTable'

export const ParticipationLogTable = ParticipationLogTableComponent
