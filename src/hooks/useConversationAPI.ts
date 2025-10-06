import { useCallback } from 'react'
import { api } from '@/lib/api'
import { formatTranscript, generateTranscriptFileName } from '@/lib/transcript'
import { ConversationState, ConversationActions } from '@/types/conversation'

interface UseConversationAPIProps {
  state: ConversationState
  actions: ConversationActions
  sessionId: string
  userId: string
  conversation: unknown // ElevenLabs conversation object
}

export const useConversationAPI = ({ state, actions, sessionId, userId, conversation }: UseConversationAPIProps) => {
  const handleEndConversation = useCallback(async () => {
    try {
      actions.setIsEnding(true)

      // End the conversation first to stop the agent from speaking
      if (conversation && typeof conversation === 'object' && 'endSession' in conversation) {
        await (conversation as { endSession: () => Promise<void> }).endSession()
      }

      // Uncover the transcript content when ending the session
      actions.setIsCensored(false)

      // Show reflection modal immediately for better UX
      actions.setIsReflectionPending(true)
      actions.setShowReflectionModal(true)

      // Defer heavy operations to prevent UI blocking
      setTimeout(async () => {
        // Upload transcript and create participationLog in background
        if (state.messages.length > 0) {
          try {
            actions.setIsSaving(true)

            // Format the transcript
            const transcriptContent = formatTranscript(
              state.messages,
              state.conversationStartTime || undefined,
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
                userId,
                transcriptUrl,
              })

              // Store the user session ID for later use
              actions.setUserSessionId(userSession.id)
            } else {
              console.error('Failed to upload transcript')
              actions.setErrorMessage('Failed to save transcript')
            }
          } catch (saveError) {
            console.error('Error saving transcript:', saveError)
            actions.setErrorMessage('Failed to save transcript')
          } finally {
            actions.setIsSaving(false)
          }
        }
      }, 100) // Small delay to let UI update first

    } catch (error) {
      actions.setErrorMessage('Failed to end conversation')
      console.error('Error ending conversation:', error)
    } finally {
      actions.setIsEnding(false)
    }
  }, [conversation, state, actions, sessionId, userId])

  const getAIEvaluation = useCallback(async (transcript: string, userSessionId: string) => {
    try {
      actions.setIsEvaluating(true)
      actions.setShowEvaluationModal(true)

      // Get evaluation from ChatGPT
      const { evaluation } = await api.evaluation.evaluateTranscript(transcript)

      if (evaluation) {
        actions.setEvaluationData(evaluation)
        actions.setUserSessionId(userSessionId)

        // Update the participation log with the evaluation data
        try {
          await api.participationLog.update(userSessionId, evaluation)
          console.log('Evaluation data saved successfully')
        } catch (updateError) {
          console.error('Error updating participation log with evaluation data:', updateError)
          // Don't fail the whole process if update fails - user can still see evaluation
        }
      } else {
        actions.setErrorMessage('Failed to get AI evaluation')
      }
    } catch (error) {
      actions.setErrorMessage('Failed to get AI evaluation')
      console.error('Error getting AI evaluation:', error)
    } finally {
      actions.setIsEvaluating(false)
    }
  }, [actions])

  const handleReflectionSubmit = useCallback(async (reflection: string) => {
    try {
      actions.setIsSaving(true)

      // Update reflection field in existing participationLog
      if (state.userSessionId) {
        try {
          console.log('Updating reflection for userSessionId:', state.userSessionId)
          await api.participationLog.update(state.userSessionId, {
            reflection,
          } as unknown as JSON)

          console.log('Reflection saved successfully')

          // Now get AI evaluation
          const transcriptContent = formatTranscript(
            state.messages,
            state.conversationStartTime || undefined,
          )
          await getAIEvaluation(transcriptContent, state.userSessionId)
        } catch (updateError) {
          console.error('Error updating reflection:', updateError)
          actions.setErrorMessage('Failed to save reflection')
        }
      } else {
        console.error('No userSessionId available for reflection update')
        actions.setErrorMessage('Failed to save reflection - session not found')
      }

      // Close reflection modal
      actions.setShowReflectionModal(false)
      actions.setIsReflectionPending(false)
    } catch (error) {
      actions.setErrorMessage('Failed to save reflection')
      console.error('Error saving reflection:', error)
    } finally {
      actions.setIsSaving(false)
    }
  }, [state, actions, getAIEvaluation])


  return {
    handleEndConversation,
    handleReflectionSubmit,
    getAIEvaluation,
  }
}
