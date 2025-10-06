import { useEffect, useCallback } from 'react'
import { useConversation } from '@elevenlabs/react'
import { ConversationActions } from '@/types/conversation'
import { parseConversationMessage } from '@/lib/conversation-utils'

interface UseConversationManagerProps {
  actions: ConversationActions
  agentId: string
}

export const useConversationManager = ({
  actions,
  agentId,
}: UseConversationManagerProps) => {
  const conversation = useConversation({
    onConnect: () => {
      actions.setIsConnecting(false)
    },
    onDisconnect: () => {},
    onMessage: (message: unknown): void => {
      const newMessage = parseConversationMessage(message)
      actions.setMessages((prev) => [...prev, newMessage])
    },
    onError: (error: string | Error): void => {
      actions.setErrorMessage(typeof error === 'string' ? error : error.message)
      console.error('Error:', error)
    },
  })

  const { status, isSpeaking } = conversation

  // Request microphone permission on component mount
  useEffect(() => {
    const requestMicPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        actions.setHasPermission(true)
      } catch (error) {
        actions.setErrorMessage('Microphone access denied')
        console.error('Error accessing microphone:', error)
      }
    }

    requestMicPermission()
  }, [actions])

  const handleStartConversation = useCallback(async () => {
    try {
      // Reset all conversation state before starting new session
      actions.resetConversationState()
      actions.setIsConnecting(true)
      // Set conversation start time
      actions.setConversationStartTime(new Date())

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
        connectionType: 'webrtc',
        signedUrl: signedUrl, 
      } as unknown as Parameters<typeof conversation.startSession>[0])
      console.log('Started conversation:', conversationId)
    } catch (error) {
      actions.setErrorMessage('Failed to start conversation')
      console.error('Error starting conversation:', error)
    }
  }, [agentId, actions, conversation])

  // Expose the conversation methods and status
  return {
    conversation,
    status,
    isSpeaking,
    handleStartConversation,
  }
}