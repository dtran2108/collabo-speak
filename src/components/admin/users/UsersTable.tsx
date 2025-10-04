'use client'

import React, { useMemo, useCallback, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AdminDataTable,
  SortableHeader,
  PaginationState,
} from '../AdminDataTable'
import { useAdminTable } from '@/hooks/useAdminTable'
import { authClient } from '@/lib/auth-client'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { AddUserModal } from '@/components/admin/users/add-user-modal'
import { UserForm } from '@/components/admin/users/user-form'
import { Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

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

  // Add user modal state
  const [addUserModal, setAddUserModal] = useState<{
    isOpen: boolean
    isLoading: boolean
  }>({
    isOpen: false,
    isLoading: false,
  })

  // Update user modal state
  const [updateUserModal, setUpdateUserModal] = useState<{
    isOpen: boolean
    isLoading: boolean
    userId: string | null
    userData: {
      fullName: string
      ieltsScore: string
      role: 'USER' | 'ADMIN'
      email: string
    } | null
  }>({
    isOpen: false,
    isLoading: false,
    userId: null,
    userData: null,
  })

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
      
      // Map the sortBy field to API field name
      const mappedParams = {
        ...params,
        sortBy: mapColumnToApiField(params.sortBy)
      }
      
      return fetchUsers(mappedParams, availableRoles)
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
    initialSorting: [{ id: 'createdAt', desc: true }],
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
        toast.error(
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

  // Add user function
  const addUser = useCallback(
    async (userData: {
      email: string
      password: string
      fullName: string
      ieltsScore?: string
      role: 'USER' | 'ADMIN'
    }) => {
      try {
        setAddUserModal((prev) => ({ ...prev, isLoading: true }))

        const {
          data: { session },
        } = await authClient.getSession()

        if (!session?.access_token) {
          throw new Error('No valid session found')
        }

        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create user')
        }

        const result = await response.json()
        console.log('User created successfully:', result)

        // Close modal and refresh data
        setAddUserModal({
          isOpen: false,
          isLoading: false,
        })

        // Refresh the table data
        await loadData()

        // Call parent callback if provided
        onAddUser?.()

        // Show success message
        toast.success(`User ${userData.email} created successfully!`)
      } catch (error) {
        console.error('Error creating user:', error)
        setAddUserModal((prev) => ({ ...prev, isLoading: false }))
        toast.error(
          `Error creating user: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        )
      }
    },
    [loadData, onAddUser],
  )

  // Handle add user button click
  const handleAddUserClick = useCallback(() => {
    setAddUserModal({
      isOpen: true,
      isLoading: false,
    })
  }, [])

  // Handle add user modal close
  const handleAddUserClose = useCallback(() => {
    setAddUserModal({
      isOpen: false,
      isLoading: false,
    })
  }, [])

  // Update user function
  const updateUser = useCallback(
    async (userData: {
      fullName: string
      ieltsScore?: string
      role: 'USER' | 'ADMIN'
    }) => {
      if (!updateUserModal.userId) return

      try {
        setUpdateUserModal((prev) => ({ ...prev, isLoading: true }))

        const {
          data: { session },
        } = await authClient.getSession()

        if (!session?.access_token) {
          throw new Error('No valid session found')
        }

        const response = await fetch(`/api/admin/users/${updateUserModal.userId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update user')
        }

        const result = await response.json()
        console.log('User updated successfully:', result)

        // Close modal and refresh data
        setUpdateUserModal({
          isOpen: false,
          isLoading: false,
          userId: null,
          userData: null,
        })

        // Refresh the table data
        await loadData()

        // Call parent callback if provided
        onEditUser?.(updateUserModal.userId)

        // Show success message
        toast.success(`User updated successfully!`)
      } catch (error) {
        console.error('Error updating user:', error)
        setUpdateUserModal((prev) => ({ ...prev, isLoading: false }))
        toast.error(
          `Error updating user: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        )
      }
    },
    [updateUserModal.userId, loadData, onEditUser],
  )

  // Handle edit button click
  const handleEditClick = useCallback((userId: string, user: User) => {
    setUpdateUserModal({
      isOpen: true,
      isLoading: false,
      userId,
      userData: {
        fullName: user.displayName,
        ieltsScore: user.ieltsScore === 'N/A' ? '' : user.ieltsScore,
        role: user.roles.includes('ADMIN') ? 'ADMIN' : 'USER',
        email: user.email,
      },
    })
  }, [])

  // Handle update user modal close
  const handleUpdateUserClose = useCallback(() => {
    setUpdateUserModal({
      isOpen: false,
      isLoading: false,
      userId: null,
      userData: null,
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditClick(row.original.userId, row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
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
    [handleEditClick, handleDeleteClick],
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
        onAddItem={handleAddUserClick}
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
          <>
            <p>You are deleting this user:</p>
            <strong className="text-orange-500">
              {deleteModal.userEmail}
            </strong>
            <p className="mt-2">
              This action cannot be undone and will permanently remove all user
              data including participation logs and profile information.
            </p>
          </>
        }
        confirmText="Delete User"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteModal.isLoading}
      />

      {/* Add User Modal */}
      <AddUserModal
        isOpen={addUserModal.isOpen}
        onClose={handleAddUserClose}
        onSubmit={addUser}
        isLoading={addUserModal.isLoading}
      />

      {/* Update User Modal */}
      {updateUserModal.userData && (
        <UserForm
          isOpen={updateUserModal.isOpen}
          onClose={handleUpdateUserClose}
          onSubmit={updateUser}
          isLoading={updateUserModal.isLoading}
          mode="update"
          initialData={updateUserModal.userData}
        />
      )}
    </>
  )
}
