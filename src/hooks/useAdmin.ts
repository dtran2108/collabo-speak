import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { authClient } from '@/lib/auth-client'

export function useAdmin() {
  const { user } = useAuth()
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdminUser(false)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Get auth token
        const { data: { session } } = await authClient.getSession()
        if (!session?.access_token) {
          setIsAdminUser(false)
          return
        }

        // Call admin check API
        const response = await fetch('/api/admin/check', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Admin check response:', data)
          setIsAdminUser(data.isAdmin)
        } else {
          console.log('Admin check failed:', response.status, response.statusText)
          setIsAdminUser(false)
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdminUser(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [user])

  return { isAdmin: isAdminUser, loading }
}
