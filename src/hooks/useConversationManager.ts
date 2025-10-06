import { useEffect, useCallback } from 'react'
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
  
  const conversation = useConversation({
    // Mobile-optimized configuration
    format: 'pcm' as const,
    // Add mobile-specific overrides
    overrides: {
      client: {
        source: 'react_sdk',
        version: '0.7.1',
      },
    },
    // Mobile audio worklet configuration
    audioWorklet: {
      enabled: true,
    },
    onConnect: () => {
      try {
        actions.setIsConnecting(false)
      } catch (error) {
        console.error('Error connecting to conversation:', error)
      }
    },
    onDisconnect: () => {
      try {
        // actions.setIsConnecting(false)
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
  })

  const { status, isSpeaking } = conversation

  // Request microphone permission on component mount
  const requestMicPermission = useCallback(async () => {
    try {
      // Mobile-optimized audio constraints
      const constraints = {
        audio: {
          echoCancellation: isMobile ? false : true, // Disable on mobile to prevent glitches
          noiseSuppression: isMobile ? false : true, // Disable on mobile to prevent glitches
          autoGainControl: true,
          sampleRate: isMobile ? 16000 : 44100, // Lower sample rate for mobile
          channelCount: 1, // Mono for mobile
          latency: isMobile ? 0.01 : 0.02, // Lower latency for mobile
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      actions.setHasPermission(true)
      
      // Clean up stream after permission check
      stream.getTracks().forEach(track => track.stop())
    } catch (error) {
      actions.setErrorMessage('Microphone access denied')
      console.error('Error accessing microphone:', error)
    }
  }, [isMobile, actions])

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

      let sessionConfig: { signedUrl: string; connectionType: 'websocket' } | { conversationToken: string; connectionType: 'webrtc' }

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
        const tokenResponse = await fetch('/api/elevenlabs/conversation-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agentId: agentId,
          }),
        })

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

      const conversationId = await conversation.startSession(sessionConfig as unknown as Parameters<typeof conversation.startSession>[0])
      console.log('Started conversation:', conversationId)
    } catch (error) {
      actions.setErrorMessage('Failed to start conversation')
      console.error('Error starting conversation:', error)
    }
  }, [agentId, connectionType, actions, conversation]) // Add back dependencies

  // Handle page visibility changes for mobile
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isMobile) {
        // Pause conversation when page goes to background on mobile
        if (conversation && typeof conversation === 'object' && 'endSession' in conversation) {
          try {
            (conversation as { endSession: () => Promise<void> }).endSession()
          } catch (error) {
            console.error('Error pausing conversation on visibility change:', error)
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [conversation, isMobile])

  // Cleanup conversation on unmount
  useEffect(() => {
    return () => {
      if (conversation && typeof conversation === 'object' && 'endSession' in conversation) {
        try {
          (conversation as { endSession: () => Promise<void> }).endSession()
        } catch (error) {
          console.error('Error cleaning up conversation:', error)
        }
      }
    }
  }, [conversation])

  // Expose the conversation methods and status
  return {
    conversation,
    status,
    isSpeaking,
    handleStartConversation,
  }
}
