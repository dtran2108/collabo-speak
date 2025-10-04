'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { UsersTable } from '@/components/admin/users/UsersTable'
import { authClient } from '@/lib/auth-client'

export default function AdminUsersPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [availableRoles, setAvailableRoles] = useState<{ id: string; name: string }[]>([])

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

  // Only show page-level loading for auth, not for data fetching
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  const handleAddUser = () => {
    // TODO: Implement add user functionality
    console.log('Add user clicked')
  }

  const handleEditUser = (userId: string) => {
    // TODO: Implement edit user functionality
    console.log('Edit user:', userId)
  }

  const handleDeleteUser = (userId: string) => {
    // TODO: Implement delete user functionality
    console.log('Delete user:', userId)
  }

  return (
    <div className="w-full max-w-full lg:max-w-[80vw] overflow-hidden">
      <UsersTable
        onAddUser={handleAddUser}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        availableRoles={availableRoles}
      />
    </div>
  )
}