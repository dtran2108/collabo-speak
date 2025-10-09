export interface Message {
  id: string
  message: string
  source: 'ai' | 'user'
  timestamp: string
  avatar?: string
  color: string
}

export interface EvaluationData {
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
}

export interface ConversationState {
  hasPermission: boolean
  errorMessage: string
  messages: Message[]
  isCensored: boolean
  conversationStartTime: Date | null
  isSaving: boolean
  isEnding: boolean
  showReflectionModal: boolean
  showEvaluationModal: boolean
  isReflectionPending: boolean
  isConnecting: boolean
  isEvaluating: boolean
  userSessionId: string | null
  evaluationData: EvaluationData | null
  showTimeLimitWarning: boolean
}

export interface ConversationActions {
  setHasPermission: (value: boolean) => void
  setErrorMessage: (message: string) => void
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  setIsCensored: (value: boolean) => void
  setConversationStartTime: (time: Date | null) => void
  setIsSaving: (value: boolean) => void
  setIsEnding: (value: boolean) => void
  setShowReflectionModal: (value: boolean) => void
  setShowEvaluationModal: (value: boolean) => void
  setIsReflectionPending: (value: boolean) => void
  setIsConnecting: (value: boolean) => void
  setIsEvaluating: (value: boolean) => void
  setUserSessionId: (id: string | null) => void
  setEvaluationData: (data: EvaluationData | null) => void
  setShowFiveMinuteWarning: (value: boolean) => void
  resetConversationState: () => void
}
