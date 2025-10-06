'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import BackBtn from '@/components/back-btn'
import { Conversation } from '@/components/conversation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Bot } from 'lucide-react'
import { api } from '@/lib/api'
import type { Session, Persona } from '@/types/database'
import { PageLoading } from '@/components/ui/loading-spinner'

interface SessionWithPersonas extends Session {
  personas: Persona[]
}

export default function Page() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const [session, setSession] = useState<SessionWithPersonas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load session and personas data
  const loadSession = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { session: sessionData } = await api.sessions.getById(sessionId)
      if (!sessionData) {
        setError('Session not found')
        return
      }
      
      const { personas } = await api.sessions.getPersonas(sessionId)

      setSession({
        ...sessionData,
        personas,
      })
    } catch (error) {
      console.error('Error loading session:', error)
      setError('Failed to load session')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  // Load session on component mount
  useEffect(() => {
    if (sessionId) {
      loadSession()
    }
  }, [sessionId, loadSession])

  if (loading) {
    return <PageLoading />
  }

  if (error || !session) {
    return (
      <div className="container mx-auto py-2 px-2">
        <div className="mb-2">
          <BackBtn />
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Session not found'}</p>
            <button
              onClick={loadSession}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-2 px-2">
      <div className="mb-2">
        <BackBtn />
      </div>
      <section className="grid md:grid-cols-4 grid-cols-1 gap-0 md:gap-4">
        <div className="col-span-1">
          <Card className="mb-4 md:mb-0">
            <CardHeader className="border-b">
              <h1 className="font-bold text-lg">{session.name}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {session.description}
              </p>
            </CardContent>
          </Card>

          {session.personas.length > 0 && (
            <Card className="my-4">
              <CardHeader className="border-b">
                <div className="flex space-x-2">
                  <Bot strokeWidth={1.25} />
                  <span className="text-lg font-bold">AI Personas</span>
                </div>
              </CardHeader>
              <CardContent>
                {session.personas.map((persona) => (
                  <div key={persona.id} className="mb-4 last:mb-0">
                    <div className="flex items-center space-x-2">
                      <Avatar>
                        <AvatarImage
                          src={persona?.avatarUrl || ''}
                          alt={persona.name}
                        />
                        <AvatarFallback>
                          {persona.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-lg font-bold">{persona.name}</span>
                    </div>
                    {persona.description && (
                      <p className="text-muted-foreground text-sm mt-2">
                        {persona.description}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
        <div className="col-span-3">
          <Card className="w-full h-full gap-0">
            <CardHeader className="border-b font-bold text-lg">
              <div className="flex items-center justify-between">
                <span>Chat Window</span>
              </div>
            </CardHeader>
            <CardContent className="py-4">
              <Conversation 
                personas={session.personas} 
                agentId={session.agentId}
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
