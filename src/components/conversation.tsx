'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

// ElevenLabs
import { useConversation } from '@elevenlabs/react'

// UI
import { Button } from '@/components/ui/button'
import { Loader, MicOff, Phone } from 'lucide-react'
import Transcript from './transcript'
import { ReflectionModal } from './ReflectionModal'
import { EvaluationModal } from './EvaluationModal'

// Database and utilities
import { api } from '@/lib/api'
import { formatTranscript, generateTranscriptFileName } from '@/lib/transcript'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Persona } from '@/types/database'

interface Message {
  id: string
  message: string
  source: 'ai' | 'user'
  timestamp: string
  avatar?: string
  color: string
}

interface ConversationProps {
  personas: Persona[]
  agentId: string
}

export function Conversation({ personas, agentId }: ConversationProps) {
  const params = useParams()
  const sessionId = params.sessionId as string
  const { user } = useAuth()

  const [hasPermission, setHasPermission] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isCensored, setIsCensored] = useState(true) // Start with censored content
  const [conversationStartTime, setConversationStartTime] =
    useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [showReflectionModal, setShowReflectionModal] = useState(false)
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)
  const [isReflectionPending, setIsReflectionPending] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [userSessionId, setUserSessionId] = useState<string | null>(null)
  const [evaluationData, setEvaluationData] = useState<{
    strengths: string[]
    improvements: string[]
    tips: string[]
    words_per_min?: number
    filler_words_per_min?: number
    participation_percentage?: number
    duration?: string
    pisa_shared_understanding?: number
    pisa_problem_solving_action?: number
    pisa_team_organization?: number
    overall_score?: number
    detailed_feedback?: string
  } | null>(null)
  const [showFiveMinuteWarning, setShowFiveMinuteWarning] = useState(false)

  const generateId = () => Math.random().toString(36).substr(2, 9)
  const getCurrentTimestamp = () =>
    new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

  const conversation = useConversation({
    onConnect: () => {
      setIsConnecting(false)
    },
    onDisconnect: () => {},
    onMessage: (message: unknown): void => {
      try {
        // Parse the message if it's a string
        const parsedMessage =
          typeof message === 'string' ? JSON.parse(message) : message

        // Check if the message has the expected format
        if (
          parsedMessage &&
          typeof parsedMessage === 'object' &&
          'message' in parsedMessage &&
          'source' in parsedMessage
        ) {
          const newMessage: Message = {
            id: generateId(),
            message: parsedMessage.message,
            source: parsedMessage.source,
            timestamp: getCurrentTimestamp(),
            color:
              parsedMessage.source === 'ai' ? 'bg-blue-500' : 'bg-green-500',
          }

          setMessages((prev) => [...prev, newMessage])
        } else {
          // Handle other message formats or fallback
          const fallbackMessage: Message = {
            id: generateId(),
            message:
              typeof message === 'string' ? message : JSON.stringify(message),
            source: 'ai', // Default to AI if source is unclear
            timestamp: getCurrentTimestamp(),
            color: 'bg-blue-500',
          }

          setMessages((prev) => [...prev, fallbackMessage])
        }
      } catch (error) {
        console.error('Error parsing message:', error)
        // Add a fallback message
        const fallbackMessage: Message = {
          id: generateId(),
          message: typeof message === 'string' ? message : 'Received a message',
          source: 'ai',
          timestamp: getCurrentTimestamp(),
          color: 'bg-blue-500',
        }

        setMessages((prev) => [...prev, fallbackMessage])
      }
    },
    onError: (error: string | Error): void => {
      setErrorMessage(typeof error === 'string' ? error : error.message)
      console.error('Error:', error)
    },
  })

  const { status, isSpeaking } = conversation

  useEffect(() => {
    // Request microphone permission on component mount
    const requestMicPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        setHasPermission(true)
      } catch (error) {
        setErrorMessage('Microphone access denied')
        console.error('Error accessing microphone:', error)
      }
    }

    requestMicPermission()
  }, [])

  // 5-minute timer effect
  useEffect(() => {
    if (!conversationStartTime) return

    const timer = setTimeout(() => {
      setShowFiveMinuteWarning(true)
    }, 5 * 60 * 1000) // 5 minutes in milliseconds

    return () => clearTimeout(timer)
  }, [conversationStartTime])

  const handleStartConversation = async () => {
    try {
      // Reset all conversation state before starting new session
      resetConversationState()
      setIsConnecting(true)
      // Set conversation start time
      setConversationStartTime(new Date())

      // Get sign URL for private agent
      const signUrlResponse = await fetch('/api/elevenlabs/sign-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agentId,
        }),
      })

      if (!signUrlResponse.ok) {
        throw new Error('Failed to get sign URL for private agent')
      }

      const responseData = await signUrlResponse.json()
      
      if (!responseData.signedUrl) {
        throw new Error('No signed URL received from API')
      }
      
      const { signedUrl } = responseData
      
      // Validate signed URL format
      if (!signedUrl || typeof signedUrl !== 'string') {
        throw new Error('Invalid signed URL format')
      }
      
      if (!signedUrl.startsWith('wss://')) {
        console.warn('Signed URL does not start with wss://:', signedUrl)
      }

      const conversationId = await conversation.startSession({
        agentId: agentId,
        connectionType: 'websocket',
        signedUrl: signedUrl, 
      } as unknown as Parameters<typeof conversation.startSession>[0])
      console.log('Started conversation:', conversationId)
    } catch (error) {
      setErrorMessage('Failed to start conversation')
      console.error('Error starting conversation:', error)
    }
  }

  const handleEndConversation = async () => {
    try {
      setIsEnding(true)

      // End the conversation
      await conversation.endSession()

      // Uncover the transcript content when ending the session
      setIsCensored(false)

      // Upload transcript and create participationLog immediately
      if (user && messages.length > 0) {
        try {
          setIsSaving(true)

          // Format the transcript
          const transcriptContent = formatTranscript(
            messages,
            conversationStartTime || undefined,
          )

          // Generate filename
          const fileName = generateTranscriptFileName(sessionId)

          // Upload transcript to storage
          const { url: transcriptUrl } = await api.transcripts.upload(
            fileName,
            transcriptContent,
          )

          if (transcriptUrl) {
            // Create user session record with transcriptUrl only (no reflection yet)
            const { userSession } = await api.participationLog.create({
              sessionId,
              userId: user.id,
              transcriptUrl,
            })

            // Store the user session ID for later use
            setUserSessionId(userSession.id)
          } else {
            console.error('Failed to upload transcript')
            setErrorMessage('Failed to save transcript')
          }
        } catch (saveError) {
          console.error('Error saving transcript:', saveError)
          setErrorMessage('Failed to save transcript')
        } finally {
          setIsSaving(false)
        }
      }

      // Set reflection as pending and open modal
      setIsReflectionPending(true)
      setShowReflectionModal(true)
    } catch (error) {
      setErrorMessage('Failed to end conversation')
      console.error('Error ending conversation:', error)
    } finally {
      setIsEnding(false)
    }
  }

  const handleReflectionSubmit = async (reflection: string) => {
    try {
      setIsSaving(true)

      // Update reflection field in existing participationLog
      if (userSessionId) {
        try {
          console.log('Updating reflection for userSessionId:', userSessionId)
          await api.participationLog.update(userSessionId, {
            reflection,
          } as unknown as JSON)

          console.log('Reflection saved successfully')

          // Now get AI evaluation
          const transcriptContent = formatTranscript(
            messages,
            conversationStartTime || undefined,
          )
          await getAIEvaluation(transcriptContent, userSessionId)
        } catch (updateError) {
          console.error('Error updating reflection:', updateError)
          setErrorMessage('Failed to save reflection')
        }
      } else {
        console.error('No userSessionId available for reflection update')
        setErrorMessage('Failed to save reflection - session not found')
      }

      // Close reflection modal
      setShowReflectionModal(false)
      setIsReflectionPending(false)
    } catch (error) {
      setErrorMessage('Failed to save reflection')
      console.error('Error saving reflection:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReopenReflection = () => {
    setShowReflectionModal(true)
  }

  const handleViewTranscript = () => {
    setShowReflectionModal(false)
  }

  const getAIEvaluation = async (transcript: string, userSessionId: string) => {
    try {
      setIsEvaluating(true)
      setShowEvaluationModal(true)

      // Get evaluation from ChatGPT
      const { evaluation } = await api.evaluation.evaluateTranscript(transcript)

      // Set evaluation data first so it shows even if PATCH fails
      setEvaluationData(evaluation)
      setIsEvaluating(false)

      // Try to update the user session with the feedback (don't fail if this doesn't work)
      try {
        await api.participationLog.update(userSessionId, evaluation)
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
      setErrorMessage('Failed to get AI evaluation')
      setIsEvaluating(false)
      // Still show modal with default data
      setEvaluationData(null)
    }
  }

  // Function to reset conversation state
  // This ensures a clean slate when starting a new conversation or closing evaluation
  const resetConversationState = () => {
    setMessages([])
    setConversationStartTime(null)
    setEvaluationData(null)
    setUserSessionId(null)
    setIsCensored(true)
    setIsSaving(false)
    setIsEnding(false)
    setIsReflectionPending(false)
    setIsConnecting(false)
    setIsEvaluating(false)
    setErrorMessage('')
    setShowReflectionModal(false)
    setShowEvaluationModal(false)
    setShowFiveMinuteWarning(false)
  }

  const handleEvaluationClose = () => {
    setShowEvaluationModal(false)
    setEvaluationData(null)
    // Keep the transcript visible, don't clear messages
  }

  return (
    <div className="space-y-4 flex flex-col justify-between h-full">
      {/* Transcript Component */}
      <div className="w-full max-w-4xl mx-auto">
        <Transcript
          messages={messages}
          isCensored={isCensored}
          personas={personas}
        />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center p-2 space-x-4">
          {isReflectionPending ? (
            <Button
              onClick={handleReopenReflection}
              disabled={isSaving}
              className="flex-1"
              variant="default"
            >
              Reflection
            </Button>
          ) : status === 'connected' ? (
            <div className="flex-1 space-y-2">
              {showFiveMinuteWarning && (
                <div className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm animate-pulse text-center">
                  ⏰ Oh, 5 minutes has passed, please try to wrap up now!
                </div>
              )}
              <Button
                variant="destructive"
                onClick={handleEndConversation}
                disabled={isSaving || isConnecting || isEnding}
                className="w-full"
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Saving your progress, please wait...
                  </div>
                ) : isEnding ? (
                  <div className="flex items-center">
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Please wait...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <MicOff className="mr-2 h-4 w-4" />
                    End Conversation
                  </div>
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleStartConversation}
              disabled={!hasPermission || isSaving || isConnecting}
              className="flex-1 bg-black hover:bg-black/80"
              variant="destructive"
            >
              {isConnecting ? (
                <>
                  <Loader className="animate-spin w-4 h-4 mr-2" />
                  Connecting...
                </>
              ) : isSaving ? (
                <div className="flex items-center">
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Saving your progress, please wait...
                </div>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Start a call
                </>
              )}
            </Button>
          )}
        </div>
        <div className="text-center text-sm">
          {status === 'connected' && (
            <p className="text-green-600">
              {isSpeaking ? 'Agent is speaking...' : 'Listening...'}
            </p>
          )}
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
          {!hasPermission && (
            <p className="text-yellow-600">
              Please allow microphone access to use voice chat
            </p>
          )}
        </div>
      </div>

      {/* Reflection Modal */}
      <ReflectionModal
        isOpen={showReflectionModal}
        onClose={() => setShowReflectionModal(false)}
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
        userSessionId={userSessionId || undefined}
      />
    </div>
  )
}
