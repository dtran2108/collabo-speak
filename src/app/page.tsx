'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bot } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { db } from '@/lib/database'
import type { Session, Persona } from '@/types/database'

interface SessionWithPersonas extends Session {
  personas: Persona[]
}

export default function Page() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionWithPersonas[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionsError, setSessionsError] = useState<string | null>(null)

  // Load sessions and their personas
  const loadSessions = async () => {
    try {
      setSessionsLoading(true)
      setSessionsError(null)

      const sessionsData = await db.sessions.getAll()
      const sessionsWithPersonas: SessionWithPersonas[] = []

      for (const session of sessionsData) {
        const personas = await db.personas.getBySessionId(session.id)
        sessionsWithPersonas.push({
          ...session,
          personas,
        })
      }

      // Sort by created_at date (earlier dates first)
      sessionsWithPersonas.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      setSessions(sessionsWithPersonas)
    } catch (error) {
      console.error('Error loading sessions:', error)
      setSessionsError('Failed to load sessions')
    } finally {
      setSessionsLoading(false)
    }
  }

  // Load sessions on component mount
  useEffect(() => {
    loadSessions()
  }, [])

  const handleStartSession = (sessionId: string) => {
    if (!user) {
      router.push('/login')
      return
    }
    console.log(
      'Starting session for user:',
      user.email,
      'Session ID:',
      sessionId,
    )
    router.push(`/chat/${sessionId}`)
  }

  if (loading || sessionsLoading) {
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
    <section className="py-32">
      <div className="container mx-auto">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <h1 className="mb-2 text-4xl font-semibold text-pretty lg:text-5xl">
            Welcome to CollaboSim
          </h1>
          <p className="text-muted-foreground">
            Sharpen your collaborative problem-solving skills with by engaging
            in realistic role-play discussions with AI-powered personas. <br />
            Select a scenario to begin!
          </p>

          {sessionsError ? (
            <div className="mt-10 text-center">
              <p className="text-red-500 mb-4">{sessionsError}</p>
              <Button onClick={loadSessions} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 place-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
                <Card key={session.id} className="w-full h-full">
                  <CardHeader className="pb-1 text-left">
                    <h2 className="text-lg font-semibold">{session.name}</h2>
                  </CardHeader>
                  <CardContent className="text-left h-full">
                    <p className="leading-snug text-muted-foreground line-clamp-4">
                      {session.description}
                    </p>
                    <div className="flex space-x-2 mt-4 text-muted-foreground">
                      <Bot strokeWidth={1.25} />
                      <span>{session.personas.length} AI personas</span>
                    </div>
                    <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 mt-2">
                      {session.personas.slice(0, 3).map((persona) => (
                        <Avatar key={persona.id}>
                          <AvatarImage src="" alt={persona.name} />
                          <AvatarFallback>
                            {persona.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
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
                      disabled={!session.isReady}
                    >
                      {session.isReady ? 'Start Session' : 'Coming Soon'}
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
