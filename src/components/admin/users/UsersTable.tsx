'use client'

import React, { useMemo, useCallback, forwardRef, useImperativeHandle } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AdminDataTable,
  SortableHeader,
} from '../AdminDataTable'
import {
  PaginationState,
  FilterConfig,
} from '../helpers'
import { useAdminTable } from '@/hooks/useAdminTable'
import { Edit, Trash2 } from 'lucide-react'

// User interface
export interface User {
  userId: string
  displayName: string
  email: string
  ieltsScore: string
  sessionParticipationCount: number
  roles: string[]
  createdAt: string
}

// Props for the UsersTable component
export interface UsersTableProps {
  onAddUser?: () => void
  onEditUser?: (userId: string, user: User) => void
  onDeleteUser?: (userId: string, userEmail: string) => void
  availableRoles?: { id: string; name: string }[]
  fetchData: (params: {
    page: number
    limit: number
    search: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
    roleId?: string
  }) => Promise<{ data: User[]; pagination: PaginationState }>
}

// Ref interface for exposing refetch function
export interface UsersTableRef {
  refetch: () => Promise<void>
}


const UsersTableComponent = forwardRef<UsersTableRef, UsersTableProps>(({
  onAddUser,
  onEditUser,
  onDeleteUser,
  availableRoles = [],
  fetchData,
}, ref) => {

  // Map frontend column names to API field names
  const mapColumnToApiField = (columnId: string): string => {
    const mapping: Record<string, string> = {
      'createdAt': 'created_at',
      'displayName': 'full_name',
      'ieltsScore': 'ielts_score',
      'sessionParticipationCount': 'session_participation_count',
      'email': 'email',
      'roles': 'roles'
    }
    return mapping[columnId] || columnId
  }

  // Create a wrapper function that maps sortBy field
  const fetchUsersWithMapping = useCallback(
    (params: {
      page: number
      limit: number
      search: string
      sortBy: string
      sortOrder: 'asc' | 'desc'
      roleId?: string
    }) => {
      // Map the sortBy field to API field name
      const mappedParams = {
        ...params,
        sortBy: mapColumnToApiField(params.sortBy)
      }
      
      return fetchData(mappedParams)
    },
    [fetchData],
  )

  // Use the admin table hook
  const {
    data: users,
    loading,
    error,
    pagination,
    sorting,
    search,
    filter: roleFilter,
    handlePaginationChange,
    handleSortingChange,
    handleSearchChange,
    handleFilterChange: handleRoleFilterChange,
    refetch,
  } = useAdminTable({
    fetchData: fetchUsersWithMapping,
    filterKey: 'roleId',
    initialLimit: 10,
    initialSorting: [{ id: 'createdAt', desc: true }],
  })

  // Expose refetch function to parent component
  useImperativeHandle(ref, () => ({
    refetch,
  }), [refetch])

  // Create dynamic filters configuration
  const filters: FilterConfig[] = useMemo(() => {
    const roleFilterConfig: FilterConfig = {
      id: 'role',
      label: 'Roles',
      type: 'select',
      options: availableRoles,
      value: roleFilter || 'all',
      onChange: handleRoleFilterChange,
      disabled: loading,
      width: 'w-full sm:w-48'
    }

    // Example: You can easily add more filters for different field types
    // const ieltsScoreFilter: FilterConfig = {
    //   id: 'ieltsScore',
    //   label: 'IELTS Score',
    //   type: 'select',
    //   options: [
    //     { id: 'all', name: 'All Scores' },
    //     { id: '9', name: '9.0' },
    //     { id: '8.5', name: '8.5' },
    //     { id: '8', name: '8.0' },
    //     { id: '7.5', name: '7.5' },
    //     { id: '7', name: '7.0' },
    //   ],
    //   value: 'all',
    //   onChange: (value) => console.log('IELTS Score filter:', value),
    //   disabled: loading,
    //   width: 'w-full sm:w-40'
    // }

    // const participationFilter: FilterConfig = {
    //   id: 'participation',
    //   label: 'Min Participation',
    //   type: 'number',
    //   placeholder: 'Min sessions',
    //   value: '',
    //   onChange: (value) => console.log('Participation filter:', value),
    //   disabled: loading,
    //   width: 'w-full sm:w-40'
    // }

    return [roleFilterConfig]
  }, [availableRoles, roleFilter, handleRoleFilterChange, loading])

  // Define columns
  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        accessorKey: 'userId',
        header: ({ column }) => (
          <SortableHeader column={column}>User ID</SortableHeader>
        ),
        size: 200,
        cell: ({ row }) => (
          <div className="font-mono text-sm whitespace-nowrap">
            {row.getValue('userId') as string}
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
        accessorKey: 'displayName',
        header: ({ column }) => (
          <SortableHeader column={column}>Display Name</SortableHeader>
        ),
        enableSorting: true,
        size: 150,
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('displayName')}</div>
        ),
      },
      {
        accessorKey: 'email',
        header: ({ column }) => (
          <SortableHeader column={column}>Email</SortableHeader>
        ),
        enableSorting: true,
        size: 200,
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.getValue('email')}
          </div>
        ),
      },
      {
        accessorKey: 'ieltsScore',
        header: ({ column }) => (
          <SortableHeader column={column}>IELTS Score</SortableHeader>
        ),
        enableSorting: true,
        size: 100,
        cell: ({ row }) => (
          <div className="text-center">{row.getValue('ieltsScore')}</div>
        ),
      },
      {
        accessorKey: 'sessionParticipationCount',
        header: ({ column }) => (
          <SortableHeader column={column}>Sessions</SortableHeader>
        ),
        enableSorting: true,
        size: 100,
        cell: ({ row }) => (
          <div className="text-center font-medium">
            {row.getValue('sessionParticipationCount')}
          </div>
        ),
      },
      {
        accessorKey: 'roles',
        header: ({ column }) => (
          <SortableHeader column={column}>Roles</SortableHeader>
        ),
        enableSorting: false,
        size: 150,
        cell: ({ row }) => {
          const roles = row.getValue('roles') as string[]
          return (
            <div className="flex flex-wrap gap-1">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <Badge
                    key={role}
                    variant={role === 'ADMIN' ? 'destructive' : 'secondary'}
                    className={`text-xs ${
                      role === 'ADMIN'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}
                  >
                    {role}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">No roles</span>
              )}
            </div>
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
              onClick={() => onEditUser?.(row.original.userId, row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onDeleteUser?.(row.original.userId, row.original.email)
              }
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onEditUser, onDeleteUser],
  )

  return (
    <>
      <AdminDataTable
        data={users}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name or email..."
        filters={filters}
        onAddItem={onAddUser}
        addButtonText="Add User"
        emptyStateMessage="No users found."
      />
    </>
  )
})

UsersTableComponent.displayName = 'UsersTable'

export const UsersTable = UsersTableComponent
