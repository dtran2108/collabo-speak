'use client'

import React, { useMemo, useCallback, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AdminDataTable,
  SortableHeader,
  PaginationState,
} from './AdminDataTable'
import { useAdminTable } from '@/hooks/useAdminTable'
import { authClient } from '@/lib/auth-client'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
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
  onEditUser?: (userId: string) => void
  onDeleteUser?: (userId: string) => void
  availableRoles?: { id: string; name: string }[]
}

// API function to fetch users
async function fetchUsers(
  params: {
    page: number
    limit: number
    search: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
    roleId?: string
  },
  availableRoles: { id: string; name: string }[] = [],
): Promise<{ data: User[]; pagination: PaginationState }> {
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

  if (params.roleId) {
    // Convert role name to role ID
    const selectedRole = availableRoles.find(
      (role) => role.name === params.roleId,
    )
    if (selectedRole) {
      searchParams.set('roleId', selectedRole.id)
      console.log(
        'DEBUG ~ fetchUsers ~ converted role name to ID:',
        params.roleId,
        '->',
        selectedRole.id,
      )
    } else {
      console.warn(
        'DEBUG ~ fetchUsers ~ role not found in availableRoles:',
        params.roleId,
      )
    }
  }

  const response = await fetch(`/api/admin/users?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }

  const result = await response.json()
  console.log('DEBUG ~ fetchUsers ~ API response:', result)

  // Transform API response to match useAdminTable expected format
  const transformedResult = {
    data: result.users,
    pagination: result.pagination,
  }
  console.log('DEBUG ~ fetchUsers ~ transformed result:', transformedResult)

  return transformedResult
}

export function UsersTable({
  onAddUser,
  onEditUser,
  onDeleteUser,
  availableRoles = [],
}: UsersTableProps) {
  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    userId: string | null
    userEmail: string | null
    isLoading: boolean
  }>({
    isOpen: false,
    userId: null,
    userEmail: null,
    isLoading: false,
  })

  // Create a wrapper function that includes availableRoles
  const fetchUsersWithRoles = useCallback(
    (params: {
      page: number
      limit: number
      search: string
      sortBy: string
      sortOrder: 'asc' | 'desc'
      roleId?: string
    }) => {
      console.log('DEBUG ~ fetchUsersWithRoles ~ params:', params)
      console.log(
        'DEBUG ~ fetchUsersWithRoles ~ availableRoles:',
        availableRoles,
      )
      return fetchUsers(params, availableRoles)
    },
    [availableRoles],
  )

  // Use the admin table hook
  const {
    data: users,
    loading,
    error,
    pagination,
    sorting,
    search,
    roleFilter,
    handlePaginationChange,
    handleSortingChange,
    handleSearchChange,
    handleRoleFilterChange,
    refetch: loadData,
  } = useAdminTable({
    fetchData: fetchUsersWithRoles,
    initialLimit: 10,
    initialSorting: [{ id: 'created_at', desc: true }],
  })

  // Delete user function
  const deleteUser = useCallback(
    async (userId: string) => {
      try {
        setDeleteModal((prev) => ({ ...prev, isLoading: true }))

        const {
          data: { session },
        } = await authClient.getSession()

        if (!session?.access_token) {
          throw new Error('No valid session found')
        }

        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete user')
        }

        const result = await response.json()
        console.log('User deleted successfully:', result)

        // Close modal and refresh data
        setDeleteModal({
          isOpen: false,
          userId: null,
          userEmail: null,
          isLoading: false,
        })

        // Refresh the table data
        await loadData()

        // Call parent callback if provided
        onDeleteUser?.(userId)
      } catch (error) {
        console.error('Error deleting user:', error)
        setDeleteModal((prev) => ({ ...prev, isLoading: false }))
        // You might want to show a toast notification here
        alert(
          `Error deleting user: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        )
      }
    },
    [loadData, onDeleteUser],
  )

  // Handle delete button click
  const handleDeleteClick = useCallback((userId: string, userEmail: string) => {
    setDeleteModal({
      isOpen: true,
      userId,
      userEmail,
      isLoading: false,
    })
  }, [])

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(() => {
    if (deleteModal.userId) {
      deleteUser(deleteModal.userId)
    }
  }, [deleteModal.userId, deleteUser])

  // Handle delete modal close
  const handleDeleteCancel = useCallback(() => {
    setDeleteModal({
      isOpen: false,
      userId: null,
      userEmail: null,
      isLoading: false,
    })
  }, [])

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
        size: 200,
        cell: ({ row }) => {
          const date = new Date(row.getValue('createdAt') as string)
          console.log('DEBUG ~ date:', date)
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
            {onEditUser && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditUser(row.original.userId)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleDeleteClick(row.original.userId, row.original.email)
              }
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onEditUser, handleDeleteClick],
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
        roleFilter={roleFilter}
        onRoleFilterChange={handleRoleFilterChange}
        availableRoles={availableRoles}
        onAddItem={onAddUser}
        addButtonText="Add User"
        emptyStateMessage="No users found."
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        description={
          <div>
            <p>Are you sure you want to delete this user:</p>
            <strong className="text-orange-500">
              {deleteModal.userEmail}?
            </strong>
            <p className="mt-2">
              This action cannot be undone and will permanently remove all user
              data including participation logs and profile information.
            </p>
          </div>
        }
        confirmText="Delete User"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteModal.isLoading}
      />
    </>
  )
}
