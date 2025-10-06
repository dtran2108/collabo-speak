import { useEffect, useRef } from 'react'
import { ConversationState, ConversationActions } from '@/types/conversation'

interface UseConversationTimerProps {
  state: ConversationState
  actions: ConversationActions
}

export const useConversationTimer = ({
  state,
  actions,
}: UseConversationTimerProps) => {
  // Use ref to store the latest actions to avoid dependency issues
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  // 5-minute timer effect
  useEffect(() => {
    if (!state.conversationStartTime) return

    const timer = setTimeout(() => {
      actionsRef.current.setShowFiveMinuteWarning(true)
    }, 5 * 60 * 1000) // 30 seconds for testing (was 5 minutes)

    return () => {
      clearTimeout(timer)
    }
  }, [state.conversationStartTime])
}
