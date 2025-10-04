'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { SessionsTable } from '@/components/admin/sessions/SessionsTable'
import { PageLoading } from '@/components/ui/loading-spinner'
import { Calendar } from 'lucide-react'

export default function AdminSessionsPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

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

  // Only show page-level loading for auth, not for data fetching
  if (loading) {
    return <PageLoading message="Loading session management..." />
  }

  const handleAddSession = () => {
    // TODO: Implement add session functionality
    console.log('Add session clicked')
  }

  const handleEditSession = (sessionId: string) => {
    // TODO: Implement edit session functionality
    console.log('Edit session:', sessionId)
  }

  const handleDeleteSession = (sessionId: string) => {
    // TODO: Implement delete session functionality
    console.log('Delete session:', sessionId)
  }

  return (
    <div className="space-y-6">
      <div className="w-full max-w-full lg:max-w-[80vw] overflow-hidden">
        <SessionsTable
          onAddSession={handleAddSession}
          onEditSession={handleEditSession}
          onDeleteSession={handleDeleteSession}
        />
      </div>
    </div>
  )
}
