import { useState, useCallback } from 'react'
import {
  ConversationState,
  ConversationActions,
  Message,
  EvaluationData,
} from '@/types/conversation'

const initialState: ConversationState = {
  hasPermission: false,
  errorMessage: '',
  messages: [],
  isCensored: true,
  conversationStartTime: null,
  isSaving: false,
  isEnding: false,
  showReflectionModal: false,
  showEvaluationModal: false,
  isReflectionPending: false,
  isConnecting: false,
  isEvaluating: false,
  userSessionId: null,
  evaluationData: null,
  showFiveMinuteWarning: false,
}

export const useConversationState = () => {
  const [state, setState] = useState<ConversationState>(initialState)

  const resetConversationState = useCallback(() => {
    setState(initialState)
  }, [])

  const actions: ConversationActions = {
    setHasPermission: (value: boolean) =>
      setState((prev) => ({ ...prev, hasPermission: value })),
    setErrorMessage: (message: string) =>
      setState((prev) => ({ ...prev, errorMessage: message })),
    setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) =>
      setState((prev) => ({
        ...prev,
        messages:
          typeof messages === 'function' ? messages(prev.messages) : messages,
      })),
    setIsCensored: (value: boolean) =>
      setState((prev) => ({ ...prev, isCensored: value })),
    setConversationStartTime: (time: Date | null) =>
      setState((prev) => ({ ...prev, conversationStartTime: time })),
    setIsSaving: (value: boolean) =>
      setState((prev) => ({ ...prev, isSaving: value })),
    setIsEnding: (value: boolean) =>
      setState((prev) => ({ ...prev, isEnding: value })),
    setShowReflectionModal: (value: boolean) =>
      setState((prev) => ({ ...prev, showReflectionModal: value })),
    setShowEvaluationModal: (value: boolean) =>
      setState((prev) => ({ ...prev, showEvaluationModal: value })),
    setIsReflectionPending: (value: boolean) =>
      setState((prev) => ({ ...prev, isReflectionPending: value })),
    setIsConnecting: (value: boolean) =>
      setState((prev) => ({ ...prev, isConnecting: value })),
    setIsEvaluating: (value: boolean) =>
      setState((prev) => ({ ...prev, isEvaluating: value })),
    setUserSessionId: (id: string | null) =>
      setState((prev) => ({ ...prev, userSessionId: id })),
    setEvaluationData: (data: EvaluationData | null) =>
      setState((prev) => ({ ...prev, evaluationData: data })),
    setShowFiveMinuteWarning: (value: boolean) => {
      setState((prev) => ({ ...prev, showFiveMinuteWarning: value }))
    },
    resetConversationState,
  }

  return { state, actions }
}
