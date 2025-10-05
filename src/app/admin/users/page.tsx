'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { UsersTable, User } from '@/components/admin/users/UsersTable'
import { authClient } from '@/lib/auth-client'
import { PageLoading } from '@/components/ui/loading-spinner'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { AddUserModal } from '@/components/admin/users/add-user-modal'
import { UserForm } from '@/components/admin/users/user-form'
import { toast } from 'sonner'

export default function AdminUsersPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [availableRoles, setAvailableRoles] = useState<{ id: string; name: string }[]>([])

  // Modal state management
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

  const [addUserModal, setAddUserModal] = useState<{
    isOpen: boolean
    isLoading: boolean
  }>({
    isOpen: false,
    isLoading: false,
  })

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

  // Fetch available roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const {
          data: { session },
        } = await authClient.getSession()
        
        if (!session?.access_token) {
          throw new Error('No valid session found')
        }

        const response = await fetch('/api/roles/all', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setAvailableRoles(data.roles || [])
        } else {
          throw new Error('Failed to fetch roles')
        }
      } catch (error) {
        console.error('Error fetching roles:', error)
        // Fallback to hardcoded roles
        setAvailableRoles([
          { id: 'admin-id', name: 'ADMIN' },
          { id: 'user-id', name: 'USER' },
        ])
      }
    }

    if (user && isAdmin) {
      fetchRoles()
    }
  }, [user, isAdmin])

  // API function to fetch users
  const fetchUsers = useCallback(
    async (params: {
      page: number
      limit: number
      search: string
      sortBy: string
      sortOrder: 'asc' | 'desc'
      roleId?: string
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

      if (params.roleId) {
        // Convert role name to role ID
        const selectedRole = availableRoles.find(
          (role) => role.name === params.roleId,
        )
        if (selectedRole) {
          searchParams.set('roleId', selectedRole.id)
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

      return {
        data: result.users,
        pagination: result.pagination,
      }
    },
    [availableRoles],
  )

  // CRUD Functions
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

        // Close modal
        setAddUserModal({
          isOpen: false,
          isLoading: false,
        })

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
    [],
  )

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

        // Close modal
        setUpdateUserModal({
          isOpen: false,
          isLoading: false,
          userId: null,
          userData: null,
        })

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
    [updateUserModal.userId],
  )

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

        // Close modal
        setDeleteModal({
          isOpen: false,
          userId: null,
          userEmail: null,
          isLoading: false,
        })

        // Show success message
        toast.success('User deleted successfully!')
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
    [],
  )

  // Event handlers
  const handleAddUser = useCallback(() => {
    setAddUserModal({
      isOpen: true,
      isLoading: false,
    })
  }, [])

  const handleEditUser = useCallback((userId: string, user: User) => {
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

  const handleDeleteUser = useCallback((userId: string, userEmail: string) => {
    setDeleteModal({
      isOpen: true,
      userId,
      userEmail,
      isLoading: false,
    })
  }, [])

  // Modal handlers
  const handleAddUserClose = useCallback(() => {
    setAddUserModal({
      isOpen: false,
      isLoading: false,
    })
  }, [])

  const handleUpdateUserClose = useCallback(() => {
    setUpdateUserModal({
      isOpen: false,
      isLoading: false,
      userId: null,
      userData: null,
    })
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (deleteModal.userId) {
      deleteUser(deleteModal.userId)
    }
  }, [deleteModal.userId, deleteUser])

  const handleDeleteCancel = useCallback(() => {
    setDeleteModal({
      isOpen: false,
      userId: null,
      userEmail: null,
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
        <UsersTable
          onAddUser={handleAddUser}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          availableRoles={availableRoles}
          fetchData={fetchUsers}
        />
      </div>

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