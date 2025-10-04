'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader, Check } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { Session, Persona } from '@/types/database'
import { ChartRadarLegend } from '@/components/charts/radar-chart'
import { OralProficiencyCard } from '@/components/oral-proficiency-card'
import { useChartData } from '@/hooks/useChartData'

interface SessionWithPersonas extends Session {
  personas: Persona[]
}

export default function Page() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionWithPersonas[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionsError, setSessionsError] = useState<string | null>(null)
  const [isStartingSession, setIsStartingSession] = useState(false)
  const [sessionParticipation, setSessionParticipation] = useState<{
    [sessionId: string]: boolean
  }>({})

  // Chart data hook - only load when user is authenticated
  const {
    hasEnoughSessions,
    weeklyData,
    pisaData,
    loading: chartLoading,
  } = useChartData()

  // Check session participation for authenticated users
  const checkSessionParticipation = useCallback(
    async (sessionIds: string[]) => {
      if (!user || sessionIds.length === 0) return

      try {
        const { participation } =
          await api.participation.checkSessionParticipation(sessionIds)
        setSessionParticipation(participation)
      } catch (error) {
        console.error('Error checking session participation:', error)
      }
    },
    [user],
  )

  // Load sessions and their personas
  const loadSessions = useCallback(async () => {
    try {
      setSessionsLoading(true)
      setSessionsError(null)

      const { sessions: sessionsData } = await api.sessions.getAll()
      const sessionsWithPersonas: SessionWithPersonas[] = []

      for (const session of sessionsData) {
        const { personas } = await api.sessions.getPersonas(session.id)
        sessionsWithPersonas.push({
          ...session,
          personas,
        })
      }

      // Sort by created_at date (earlier dates first)
      sessionsWithPersonas.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )

      setSessions(sessionsWithPersonas)

      // Check participation for authenticated users
      if (user) {
        const sessionIds = sessionsWithPersonas.map((session) => session.id)
        await checkSessionParticipation(sessionIds)
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
      setSessionsError('Failed to load sessions')
    } finally {
      setSessionsLoading(false)
    }
  }, [user, checkSessionParticipation])

  // Load sessions on component mount
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Check participation when user changes
  useEffect(() => {
    if (user && sessions.length > 0) {
      const sessionIds = sessions.map((session) => session.id)
      checkSessionParticipation(sessionIds)
    } else if (!user) {
      setSessionParticipation({})
    }
  }, [user, sessions, checkSessionParticipation])

  const handleStartSession = (sessionId: string) => {
    if (!user) {
      router.push('/login')
      return
    }
    setIsStartingSession(true)
    console.log(
      'Starting session for user:',
      user.email,
      'Session ID:',
      sessionId,
    )
    router.push(`/chat/${sessionId}`)
  }

  if (loading || sessionsLoading || (user && chartLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            {loading ? 'Loading...' : 'Loading sessions...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <section className="py-4">
      <div className="mx-2">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 gap-0 space-y-4 lg:space-y-0 items-stretch relative">
            <div className="col-span-1 flex w-full">
              <div
                className={`w-full ${
                  !user || !hasEnoughSessions ? 'blur-[3px]' : ''
                }`}
              >
                <ChartRadarLegend pisaData={pisaData} />
              </div>
            </div>
            <div className="col-span-2 flex w-full">
              <div
                className={`w-full ${
                  !user || !hasEnoughSessions ? 'blur-[3px]' : ''
                }`}
              >
                <OralProficiencyCard weeklyData={weeklyData} />
              </div>
            </div>

            {/* Single overlay covering both charts */}
            {(!user || !hasEnoughSessions) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black text-white px-6 py-3 rounded-lg text-sm font-semibold text-center">
                  {!user
                    ? 'Please complete at least 2 sessions to see your progress'
                    : 'Progress will be updated after 2 sessions'}
                </div>
              </div>
            )}
          </div>
          <h1 className="mt-4 text-lg ml-2 font-semibold text-pretty lg:text-3xl">
            Select one scenario to begin!
          </h1>
          {sessionsError ? (
            <div className="mt-10 text-center">
              <p className="text-red-500 mb-4">{sessionsError}</p>
              <Button onClick={loadSessions} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-1 place-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className="w-full h-full flex-1 py-4 gap-2 relative"
                >
                  <CardHeader className="pb-1 text-left">
                    <div className="flex flex-col justify-between">
                      <h2 className="text-lg font-semibold">{session.name}</h2>
                      {user && sessionParticipation[session.id] && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <Check className="h-4 w-4" />
                          <span className="text-xs font-medium">Completed</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="text-left h-full">
                    <div className="flex items-center space-x-2">
                      <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 mb-2 items-center">
                        {session.personas.slice(0, 3).map((persona) => (
                          <Avatar key={persona.id}>
                            <AvatarImage
                              src={persona.avatarUrl || ''}
                              alt={persona.name}
                            />
                            <AvatarFallback>
                              {persona.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {session.personas
                          .slice(0, 3)
                          .map(
                            (persona, index) =>
                              `${persona.name}${
                                index < session.personas.length - 1 ? ', ' : ''
                              }`,
                          )}
                      </span>
                      {session.personas.length > 3 && (
                        <Avatar>
                          <AvatarFallback className="bg-gray-500 text-white">
                            +{session.personas.length - 3}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="">
                    <Button
                      className="w-full"
                      onClick={() => handleStartSession(session.id)}
                      disabled={!session.isReady || isStartingSession}
                    >
                      {isStartingSession ? (
                        <div className="flex items-center space-x-2">
                          <Loader className="animate-spin w-4 h-4 mr-2" />{' '}
                          <span>Preparing Session...</span>
                        </div>
                      ) : session.isReady ? (
                        'Start Session'
                      ) : (
                        'Coming Soon'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}

              {sessions.length === 0 && !sessionsLoading && (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">
                    No sessions available at the moment.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
