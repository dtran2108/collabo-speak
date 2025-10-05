'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { ParticipationLogTable, ParticipationLog, ParticipationLogTableRef } from '@/components/admin/participation-log/ParticipationLogTable'
import { ParticipationLogDetailModal } from '@/components/admin/participation-log/ParticipationLogDetailModal'
import { authClient } from '@/lib/auth-client'
import { PageLoading } from '@/components/ui/loading-spinner'

export default function AdminParticipationLogPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const participationLogTableRef = useRef<ParticipationLogTableRef>(null)

  // Modal state management
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean
    participationLog: ParticipationLog | null
  }>({
    isOpen: false,
    participationLog: null,
  })

  // Session options for filter
  const [sessionOptions, setSessionOptions] = useState<Array<{ id: string; name: string }>>([])

  // Fetch session options for filter
  const fetchSessionOptions = useCallback(async () => {
    try {
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

      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const result = await response.json()
      setSessionOptions(result.sessions.map((session: any) => ({
        id: session.id,
        name: session.name
      })))
    } catch (error) {
      console.error('Error fetching session options:', error)
    }
  }, [])

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
    if (user && isAdmin) {
      fetchSessionOptions()
    }
  }, [user, loading, isAdmin, router, fetchSessionOptions])

  // API function to fetch participation logs
  const fetchParticipationLogs = useCallback(
    async (params: {
      page: number
      limit: number
      search: string
      sortBy: string
      sortOrder: 'asc' | 'desc'
      sessionId?: string
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

      if (params.sessionId !== undefined) {
        searchParams.set('sessionId', params.sessionId)
      }

      const response = await fetch(`/api/admin/participation-log?${searchParams}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch participation logs')
      }

      const result = await response.json()

      return {
        data: result.participationLogs,
        pagination: result.pagination,
      }
    },
    [],
  )

  // Event handlers
  const handleViewDetails = useCallback((participationLog: ParticipationLog) => {
    setDetailModal({
      isOpen: true,
      participationLog,
    })
  }, [])

  // Modal handlers
  const handleDetailClose = useCallback(() => {
    setDetailModal({
      isOpen: false,
      participationLog: null,
    })
  }, [])

  // Only show page-level loading for auth, not for data fetching
  if (loading) {
    return <PageLoading />
  }

  return (
    <>
      <div className="w-full max-w-full lg:max-w-[80vw] overflow-hidden">
        <ParticipationLogTable
          ref={participationLogTableRef}
          onViewDetails={handleViewDetails}
          fetchData={fetchParticipationLogs}
          sessionOptions={sessionOptions}
        />
      </div>

      {/* Detail Modal */}
      <ParticipationLogDetailModal
        isOpen={detailModal.isOpen}
        onClose={handleDetailClose}
        participationLog={detailModal.participationLog}
      />
    </>
  )
}
