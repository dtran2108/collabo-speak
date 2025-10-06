import { useEffect, useCallback, useMemo } from 'react'
import { useConversation } from '@elevenlabs/react'
import { ConversationActions } from '@/types/conversation'
import { parseConversationMessage } from '@/lib/conversation-utils'
import { useIsMobile } from '@/hooks/use-mobile'

interface UseConversationManagerProps {
  actions: ConversationActions
  agentId: string
  connectionType?: 'websocket' | 'webrtc'
}

export const useConversationManager = ({
  actions,
  agentId,
  connectionType = 'websocket',
}: UseConversationManagerProps) => {
  const isMobile = useIsMobile()

  // Memoize the conversation configuration to prevent recreation
  const conversationConfig = useMemo(() => ({
    // Simplified configuration for better WebRTC compatibility
    overrides: {
      client: {
        source: 'react_sdk',
        version: '0.7.1',
      },
    },
    onConnect: () => {
      try {
        console.log('WebRTC conversation connected successfully')
        actions.setIsConnecting(false)
      } catch (error) {
        console.error('Error connecting to conversation:', error)
        actions.setErrorMessage('Failed to connect to conversation')
      }
    },
    onDisconnect: (details: any) => {
      try {
        console.log('WebRTC conversation disconnected:', details)
        console.log('Disconnect reason:', details?.reason)
        console.log('Disconnect details:', details)
        actions.setIsConnecting(false)
        if (details?.reason === 'error') {
          actions.setErrorMessage('Connection lost. Please try again.')
        } else if (details?.reason === 'user') {
          console.log('Conversation ended by user - this might be unexpected')
        }
      } catch (error) {
        console.error('Error disconnecting from conversation:', error)
      }
    },
    onMessage: (message: unknown): void => {
      try {
        const newMessage = parseConversationMessage(message)
        actions.setMessages((prev) => [...prev, newMessage])
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    },
    onError: (error: string | Error): void => {
      actions.setErrorMessage(typeof error === 'string' ? error : error.message)
      console.error('Error:', error)
    },
  }), [actions])

  const conversation = useConversation(conversationConfig)

  const { status, isSpeaking } = conversation

  // Request microphone permission on component mount
  const requestMicPermission = useCallback(async () => {
    try {
      // Simple permission check without complex constraints
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      actions.setHasPermission(true)

      // Clean up stream after permission check
      stream.getTracks().forEach((track) => track.stop())
    } catch (error) {
      actions.setErrorMessage('Microphone access denied')
      console.error('Error accessing microphone:', error)
    }
  }, [actions])

  useEffect(() => {
    requestMicPermission()
  }, [requestMicPermission])

  const handleStartConversation = useCallback(async () => {
    try {
      // Reset all conversation state before starting new session
      actions.resetConversationState()
      actions.setIsConnecting(true)
      // Set conversation start time
      actions.setConversationStartTime(new Date())

      let sessionConfig:
        | { signedUrl: string; connectionType: 'websocket' }
        | { conversationToken: string; connectionType: 'webrtc' }

      if (connectionType === 'websocket') {
        // Get sign URL for WebSocket connection
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

        sessionConfig = {
          signedUrl: signedUrl,
          connectionType: 'websocket',
        }
      } else {
        // Get conversation token for WebRTC connection
        const tokenResponse = await fetch(
          '/api/elevenlabs/conversation-token',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              agentId: agentId,
            }),
          },
        )

        if (!tokenResponse.ok) {
          throw new Error('Failed to get conversation token for WebRTC')
        }

        const responseData = await tokenResponse.json()

        if (!responseData.conversationToken) {
          throw new Error('No conversation token received from API')
        }

        const { conversationToken } = responseData

        // Validate conversation token format
        if (!conversationToken || typeof conversationToken !== 'string') {
          throw new Error('Invalid conversation token format')
        }

        sessionConfig = {
          conversationToken: conversationToken,
          connectionType: 'webrtc',
        }
      }

      console.log('Starting conversation with config:', sessionConfig)

      const conversationId = await conversation.startSession(
        sessionConfig as unknown as Parameters<
          typeof conversation.startSession
        >[0],
      )
      console.log('Started conversation successfully:', conversationId)
    } catch (error) {
      console.error('Error starting conversation:', error)
      actions.setErrorMessage(
        `Failed to start conversation: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      )
      actions.setIsConnecting(false)
    }
  }, [agentId, connectionType, actions, conversation]) // Add back dependencies

  // Handle page visibility changes for mobile
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isMobile && status === 'connected') {
        // Only pause conversation when page goes to background on mobile AND conversation is active
        console.log('Page went to background, pausing conversation')
        if (
          conversation &&
          typeof conversation === 'object' &&
          'endSession' in conversation
        ) {
          try {
            ;(conversation as { endSession: () => Promise<void> }).endSession()
          } catch (error) {
            console.error(
              'Error pausing conversation on visibility change:',
              error,
            )
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isMobile, status]) // Remove conversation from dependencies

  // Note: Cleanup is handled by the conversation object itself
  // No manual cleanup needed to prevent premature disconnection

  // Expose the conversation methods and status
  return {
    conversation,
    status,
    isSpeaking,
    handleStartConversation,
  }
}
