import { useEffect } from 'react'
import { ConversationState, ConversationActions } from '@/types/conversation'

interface UseConversationTimerProps {
  state: ConversationState
  actions: ConversationActions
}

export const useConversationTimer = ({ state, actions }: UseConversationTimerProps) => {
  // 5-minute timer effect
  useEffect(() => {
    if (!state.conversationStartTime) return

    const timer = setTimeout(() => {
      actions.setShowFiveMinuteWarning(true)
    }, 5 * 60 * 1000) // 5 minutes in milliseconds

    return () => clearTimeout(timer)
  }, [state.conversationStartTime, actions])
}
