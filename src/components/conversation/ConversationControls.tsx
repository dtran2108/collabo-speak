import React from 'react'
import { Button } from '@/components/ui/button'
import { Loader, MicOff, Phone } from 'lucide-react'
import { ConversationState } from '@/types/conversation'

interface ConversationControlsProps {
  state: ConversationState
  status: string
  isSpeaking: boolean
  onStartConversation: () => void
  onEndConversation: () => void
  onReopenReflection: () => void
}

export const ConversationControls: React.FC<ConversationControlsProps> = ({
  state,
  status,
  isSpeaking,
  onStartConversation,
  onEndConversation,
  onReopenReflection,
}) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center p-2 space-x-4">
        {state.isReflectionPending ? (
          <Button
            onClick={onReopenReflection}
            disabled={state.isSaving}
            className="flex-1"
            variant="default"
          >
            Reflection
          </Button>
        ) : status === 'connected' ? (
          <div className="flex-1 space-y-2">
            {state.showFiveMinuteWarning && (
              <div className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm animate-pulse text-center">
                ⏰ Oh, 5 minutes has passed, please try to wrap up now!
              </div>
            )}
            <Button
              variant="destructive"
              onClick={onEndConversation}
              disabled={state.isSaving || state.isConnecting || state.isEnding}
              className="w-full"
            >
              {state.isSaving ? (
                <div className="flex items-center">
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Saving your progress, please wait...
                </div>
              ) : state.isEnding ? (
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
            onClick={onStartConversation}
            disabled={
              !state.hasPermission || state.isSaving || state.isConnecting
            }
            className="flex-1 bg-black hover:bg-black/80"
            variant="destructive"
          >
            {state.isConnecting ? (
              <>
                <Loader className="animate-spin w-4 h-4 mr-2" />
                Connecting...
              </>
            ) : state.isSaving ? (
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
        {state.errorMessage && (
          <p className="text-red-500">{state.errorMessage}</p>
        )}
        {!state.hasPermission && (
          <p className="text-yellow-600">
            Please allow microphone access to use voice chat
          </p>
        )}
      </div>
    </div>
  )
}
