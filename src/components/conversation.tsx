'use client'

import React from 'react'
import { useParams } from 'next/navigation'

// UI Components
import Transcript from './transcript'
import { ReflectionModal } from './ReflectionModal'
import { EvaluationModal } from './EvaluationModal'
import { ConversationControls } from './conversation/ConversationControls'
import { useConversationManager } from '@/hooks/useConversationManager'

// Hooks and utilities
import { useConversationState } from '@/hooks/useConversationState'
import { useConversationTimer } from '@/hooks/useConversationTimer'
import { useConversationAPI } from '@/hooks/useConversationAPI'
import { useAuth } from '@/contexts/AuthContext'
import { Persona } from '@/types/database'

interface ConversationProps {
  personas: Persona[]
  agentId: string
  connectionType?: 'websocket' | 'webrtc'
}

export function Conversation({ personas, agentId, connectionType = 'websocket' }: ConversationProps) {
  const params = useParams()
  const sessionId = params.sessionId as string
  const { user } = useAuth()

  // Use custom hooks for state management
  const { state, actions } = useConversationState()
  
  // Use conversation timer hook
  useConversationTimer({ state, actions })
  
  // Use conversation manager hook first to get conversation object
  const { conversation, status, isSpeaking, handleStartConversation } = useConversationManager({
    actions,
    agentId,
    connectionType,
  })

  // Use conversation API hook
  const { handleEndConversation, handleReflectionSubmit } = useConversationAPI({
    state,
    actions,
    sessionId,
    userId: user?.id || '',
    conversation,
  })

  const handleReopenReflection = () => {
    actions.setShowReflectionModal(true)
  }

  const handleViewTranscript = () => {
    actions.setShowReflectionModal(false)
  }

  const handleEvaluationClose = () => {
    actions.setShowEvaluationModal(false)
    actions.setEvaluationData(null)
    // Keep the transcript visible, don't clear messages
  }

  return (
    <div className="space-y-4 flex flex-col justify-between h-full">
      {/* Transcript Component */}
      <div className="w-full max-w-4xl mx-auto">
        <Transcript
          messages={state.messages}
          isCensored={state.isCensored}
          personas={personas}
        />
      </div>

      {/* Conversation Controls */}
      <ConversationControls
        state={state}
        status={status}
        isSpeaking={isSpeaking}
        onStartConversation={handleStartConversation}
        onEndConversation={handleEndConversation}
        onReopenReflection={handleReopenReflection}
      />

      {/* Reflection Modal */}
      <ReflectionModal
        isOpen={state.showReflectionModal}
        onClose={() => actions.setShowReflectionModal(false)}
        onSubmit={handleReflectionSubmit}
        onViewTranscript={handleViewTranscript}
        isSubmitting={state.isSaving}
      />

      {/* Evaluation Modal */}
      <EvaluationModal
        isOpen={state.showEvaluationModal}
        onClose={handleEvaluationClose}
        evaluationData={state.evaluationData}
        isLoading={state.isEvaluating}
        userSessionId={state.userSessionId || undefined}
      />
    </div>
  )
}
