'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Ratings } from '@/components/rating'
import { PageLoading } from '@/components/ui/loading-spinner'
import {
  History,
  Calendar,
  MessageSquare,
  BarChart3,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ReflectionModal } from '@/components/ReflectionModal'
import { EvaluationModal } from '@/components/EvaluationModal'
import { api } from '@/lib/api'

// Type for the API response that includes joined sessions data
interface SessionData {
  id: string
  sessionId: string
  userId: string
  transcriptUrl: string | null
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
  duration: string | null
  pisa_shared_understanding: number | null
  pisa_problem_solving_action: number | null
  pisa_team_organization: number | null
  created_at: string
  sessions: {
    id: string
    name: string
    description: string
    agentId: string
    isReady: boolean | null
  }
}

export default function SessionHistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [filters, setFilters] = useState({
    search: '',
    sessionId: '',
  })
  const [availableSessions, setAvailableSessions] = useState<
    Array<{ id: string; name: string }>
  >([])
  const [reflectionModal, setReflectionModal] = useState<{
    isOpen: boolean
    participationId: string
  }>({
    isOpen: false,
    participationId: '',
  })
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)
  const [evaluationSessionId, setEvaluationSessionId] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationData, setEvaluationData] = useState<{
    strengths: string[]
    improvements: string[]
    tips: string[]
    big_picture_thinking: string[]
    words_per_min?: number
    filler_words_per_min?: number
    participation_percentage?: number
    duration?: string
    pisa_shared_understanding?: number
    pisa_problem_solving_action?: number
    pisa_team_organization?: number
  } | null>(null)

  const loadSessionHistory = useCallback(async () => {
    try {
      setIsLoading(true)
      const { sessionToUser, pagination: paginationData } =
        await api.participationLog.getAll({
          page: pagination.page,
          limit: pagination.limit,
          sessionId: filters.sessionId || undefined,
          search: filters.search || undefined,
        })

      // Type assertion since we know the API returns joined data with sessions
      setSessions(sessionToUser as unknown as SessionData[])
      setPagination(paginationData)

      // Extract unique sessions for filter dropdown
      const uniqueSessions = Array.from(
        new Map(
          ((sessionToUser as unknown as SessionData[]) || []).map((session) => [
            session.sessions.id,
            { id: session.sessions.id, name: session.sessions.name },
          ]),
        ).values(),
      )
      setAvailableSessions(uniqueSessions)
    } catch (error) {
      console.error('Error loading session history:', error)
      toast.error('Failed to load session history')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, filters.sessionId, filters.search])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadSessionHistory()
    }
  }, [user, loading, router, loadSessionHistory])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, page: 1 })) // Reset to first page when filtering
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  const handleApplyFilters = () => {
    loadSessionHistory()
  }

  const handleClearFilters = () => {
    setFilters({ search: '', sessionId: '' })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleWriteReflection = (participationId: string) => {
    setReflectionModal({
      isOpen: true,
      participationId,
    })
  }

  const handleReflectionSubmit = async (reflection: string) => {
    try {
      setIsSaving(true)

      // Update reflection field in existing participationLog
      if (reflectionModal.participationId) {
        try {
          console.log(
            'Updating reflection for participationId:',
            reflectionModal.participationId,
          )
          await api.participationLog.update(reflectionModal.participationId, {
            reflection,
          } as unknown as JSON)

          console.log('Reflection saved successfully')

          // Now get AI evaluation - we need to get the transcript from the session
          const currentSession = sessions.find(
            (s) => s.id === reflectionModal.participationId,
          )
          if (currentSession?.transcriptUrl) {
            try {
              // Fetch the transcript content
              const transcriptResponse = await fetch(
                currentSession.transcriptUrl,
              )
              if (transcriptResponse.ok) {
                const transcriptText = await transcriptResponse.text()
                await getAIEvaluation(
                  transcriptText,
                  reflectionModal.participationId,
                )
              } else {
                console.error('Failed to fetch transcript')
                toast.warning(
                  'Reflection saved, but transcript not available for evaluation',
                )
              }
            } catch (transcriptError) {
              console.error('Error fetching transcript:', transcriptError)
              toast.warning(
                'Reflection saved, but failed to fetch transcript for evaluation',
              )
            }
          } else {
            console.error('No transcript URL available for evaluation')
            toast.warning(
              'Reflection saved, but no transcript available for evaluation',
            )
          }
        } catch (updateError) {
          console.error('Error updating reflection:', updateError)
          toast.error('Failed to save reflection')
        }
      } else {
        console.error('No participationId available for reflection update')
        toast.error('Failed to save reflection - session not found')
      }

      // Close reflection modal
      setReflectionModal({ isOpen: false, participationId: '' })
    } catch (error) {
      toast.error('Failed to save reflection')
      console.error('Error saving reflection:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const getAIEvaluation = async (transcript: string, userSessionId: string) => {
    try {
      setIsEvaluating(true)
      setEvaluationSessionId(userSessionId)
      setShowEvaluationModal(true)

      // Get evaluation from ChatGPT
      const { evaluation } = await api.evaluation.evaluateTranscript(transcript)

      // Set evaluation data first so it shows even if PATCH fails
      setEvaluationData({
        ...evaluation,
        duration: evaluation.duration?.toString(),
      })
      setIsEvaluating(false)

      // Try to update the user session with the feedback (don't fail if this doesn't work)
      try {
        await api.participationLog.update(userSessionId, evaluation)
        // Don't reload here - let the modal stay open until user closes it
        console.log('Evaluation data saved successfully')
      } catch (updateError) {
        console.error(
          'Error updating user session (but evaluation data is still shown):',
          updateError,
        )
        toast.warning(
          'Failed to save evaluation data to database, but you can still view your feedback',
        )
      }
    } catch (error) {
      console.error('Error getting AI evaluation:', error)
      toast.error('Failed to get AI evaluation')
      setIsEvaluating(false)
      // Still show modal with default data
      setEvaluationData(null)
    }
  }

  const handleViewTranscript = () => {
    setReflectionModal({ isOpen: false, participationId: '' })
  }

  const handleEvaluationClose = () => {
    setShowEvaluationModal(false)
    setEvaluationData(null)
    setEvaluationSessionId('')
    // Reload session history to show updated data
    loadSessionHistory()
  }

  // Load data when filters or pagination change
  useEffect(() => {
    if (user) {
      loadSessionHistory()
    }
  }, [pagination.page, filters, user, loadSessionHistory])

  if (loading || isLoading) {
    return <PageLoading />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen pt-8">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <History className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">
              Session History
            </h1>
          </div>
          <p className="text-gray-600">
            View your past conversation sessions and performance evaluations
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Filters</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Session Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Session
                </label>
                <select
                  value={filters.sessionId}
                  onChange={(e) =>
                    handleFilterChange('sessionId', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Sessions</option>
                  {availableSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-end space-x-2">
                <Button onClick={handleApplyFilters} className="flex-1">
                  Apply Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="flex-1"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <History className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No sessions yet
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Start your first conversation to see your session history here
              </p>
              <Link href="/">
                <Button>Start a Conversation</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {session.sessions.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {session.sessions.description}
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className="flex items-center space-x-1"
                    >
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(session.created_at)}</span>
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Performance Metrics */}
                  {(session.words_per_min !== null ||
                    session.filler_words_per_min !== null ||
                    session.participation_percentage !== null ||
                    session.duration !== null) && (
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <BarChart3 className="h-5 w-5 text-purple-500" />
                        <h4 className="font-semibold text-gray-900">
                          Oral Production
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {session.words_per_min !== null && (
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-600 mb-1">
                              WPM
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                              {session.words_per_min}
                            </p>
                          </div>
                        )}
                        {session.filler_words_per_min !== null && (
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-600 mb-1">
                              Fillers/min
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                              {session.filler_words_per_min}
                            </p>
                          </div>
                        )}
                        {session.participation_percentage !== null && (
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-600 mb-1">
                              % of Speaking Time
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                              {session.participation_percentage}%
                            </p>
                          </div>
                        )}
                        {session.duration !== null && (
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-600 mb-1">
                              Duration
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                              {session.duration}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PISA Scores */}
                  {(session.pisa_shared_understanding !== null ||
                    session.pisa_problem_solving_action !== null ||
                    session.pisa_team_organization !== null) && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        PISA Collaborative Problem Solving
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {session.pisa_shared_understanding !== null && (
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-2">
                              Establishing and Maintaining a Shared
                              Understanding
                            </div>
                            <div className="flex justify-center">
                              <Ratings
                                rating={session?.pisa_shared_understanding || 0}
                                totalStars={4}
                                size={16}
                                variant="yellow"
                              />
                            </div>
                          </div>
                        )}
                        {session.pisa_problem_solving_action !== null && (
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-2">
                              Taking Appropriate Action to Solve the Problem
                            </div>
                            <div className="flex justify-center">
                              <Ratings
                                rating={
                                  session?.pisa_problem_solving_action || 0
                                }
                                totalStars={4}
                                size={16}
                                variant="yellow"
                              />
                            </div>
                          </div>
                        )}
                        {session.pisa_team_organization !== null && (
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-2">
                              Establishing and Maintaining Team Organization
                            </div>
                            <div className="flex justify-center">
                              <Ratings
                                rating={session?.pisa_team_organization || 0}
                                totalStars={4}
                                size={16}
                                variant="yellow"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Big Picture Thinking */}
                  {session.feedback?.big_picture_thinking &&
                    session.feedback.big_picture_thinking.length > 0 && (
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-200 shadow-lg">
                        <div className="flex items-center space-x-3 mb-4">
                          <h4 className="text-xl font-bold text-indigo-800">
                            🌐 Big Picture Thinking
                          </h4>
                        </div>
                        <div className="space-y-3">
                          <p className="text-sm text-indigo-700 font-medium mb-3">
                            Also, think about the bigger context next time — for
                            example:
                          </p>
                          <ul className="">
                            {session.feedback.big_picture_thinking.map(
                              (item, index) => (
                                <li
                                  key={index}
                                  className="text-sm ml-3 text-gray-800 flex items-start"
                                >
                                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                  {item}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      </div>
                    )}

                  {/* Feedback */}
                  {session.feedback !== null && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">
                        AI Feedback
                      </h4>

                      {session.feedback.strengths &&
                        session.feedback.strengths.length > 0 && (
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              {/* <TrendingUp className="h-4 w-4 text-green-500" /> */}
                              <h5 className="font-medium text-green-700">
                                👍 What you did well
                              </h5>
                            </div>
                            <ul className="space-y-1 pl-6">
                              {session.feedback.strengths.map(
                                (strength, index) => (
                                  <li
                                    key={index}
                                    className="text-sm text-gray-700 flex items-start"
                                  >
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                    {strength}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}

                      {session.feedback.improvements &&
                        session.feedback.improvements.length > 0 && (
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              {/* <Target className="h-4 w-4 text-orange-500" /> */}
                              <h5 className="font-medium text-orange-700">
                                🔧 What to work on
                              </h5>
                            </div>
                            <ul className="space-y-1 pl-6">
                              {session.feedback.improvements.map(
                                (improvement, index) => (
                                  <li
                                    key={index}
                                    className="text-sm text-gray-700 flex items-start"
                                  >
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                    {improvement}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}

                      {session.feedback.tips &&
                        session.feedback.tips.length > 0 && (
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              {/* <Lightbulb className="h-4 w-4 text-blue-500" /> */}
                              <h5 className="font-medium text-blue-700">
                                💡 Tips for next time
                              </h5>
                            </div>
                            <ul className="space-y-1 pl-6">
                              {session.feedback.tips.map((tip, index) => (
                                <li
                                  key={index}
                                  className="text-sm text-gray-700 flex items-start"
                                >
                                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Reflection */}
                  {session.reflection !== null && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-purple-500" />
                        <h5 className="font-medium text-purple-700">
                          Your Reflection
                        </h5>
                      </div>
                      <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded-lg">
                        {session.reflection}
                      </p>
                    </div>
                  )}

                  {/* User Question or Feedback */}
                  {session.user_question_or_feedback !== null && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <h5 className="font-medium text-blue-700">
                          Your Question or Feedback
                        </h5>
                      </div>
                      <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                        {session.user_question_or_feedback}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div>
                      {session.reflection === null && (
                        <Button
                          onClick={() => handleWriteReflection(session.id)}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Write Reflection Now
                        </Button>
                      )}
                    </div>
                    <Link href={`/chat/${session.sessionId}`}>
                      <Button variant="outline" size="sm">
                        View Session
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {sessions.length > 0 && (
          <Card className="mt-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{' '}
                  of {pagination.total} results
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="flex items-center space-x-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        const pageNum = i + 1
                        const isActive = pageNum === pagination.page

                        return (
                          <Button
                            key={pageNum}
                            variant={isActive ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      },
                    )}

                    {pagination.totalPages > 5 && (
                      <>
                        <span className="text-gray-400">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handlePageChange(pagination.totalPages)
                          }
                          className="w-8 h-8 p-0"
                        >
                          {pagination.totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="flex items-center space-x-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reflection Modal */}
        <ReflectionModal
          isOpen={reflectionModal.isOpen}
          onClose={() =>
            setReflectionModal({ isOpen: false, participationId: '' })
          }
          onSubmit={handleReflectionSubmit}
          onViewTranscript={handleViewTranscript}
          isSubmitting={isSaving}
        />

        {/* Evaluation Modal */}
        <EvaluationModal
          isOpen={showEvaluationModal}
          onClose={handleEvaluationClose}
          evaluationData={evaluationData}
          isLoading={isEvaluating}
          userSessionId={evaluationSessionId || undefined}
        />
      </div>
    </div>
  )
}
