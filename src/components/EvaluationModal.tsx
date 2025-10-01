import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle, Target, Lightbulb, Loader2 } from 'lucide-react'

interface EvaluationData {
  strengths: string[]
  improvements: string[]
  tips: string[]
}

interface EvaluationModalProps {
  isOpen: boolean
  onClose: () => void
  evaluationData?: EvaluationData | null
  isLoading?: boolean
}

export function EvaluationModal({
  isOpen,
  onClose,
  evaluationData,
  isLoading = false,
}: EvaluationModalProps) {
  const data = evaluationData

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Performance Evaluation
          </DialogTitle>
          <DialogDescription className="text-center">
            {isLoading
              ? 'Analyzing your conversation...'
              : "Here's how you did in this conversation"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-muted-foreground">
              AI is analyzing your conversation...
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* What you did well */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold text-green-700">
                  What you did well?
                </h3>
              </div>
              <ul className="space-y-2 pl-7">
                {data?.strengths.map((strength, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 flex items-start animate-in slide-in-from-left-2 duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* What to work on */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-orange-700">
                  What to work on?
                </h3>
              </div>
              <ul className="space-y-2 pl-7">
                {data?.improvements.map((improvement, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 flex items-start animate-in slide-in-from-left-2 duration-300"
                    style={{
                      animationDelay: `${
                        (index + data?.strengths.length) * 100
                      }ms`,
                    }}
                  >
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tips for next time */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-blue-700">
                  Tips for next time
                </h3>
              </div>
              <ul className="space-y-2 pl-7">
                {data?.tips.map((tip, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 flex items-start animate-in slide-in-from-left-2 duration-300"
                    style={{
                      animationDelay: `${
                        (index +
                          data?.strengths.length +
                          data?.improvements.length) *
                        100
                      }ms`,
                    }}
                  >
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <Button onClick={onClose} className="px-8" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Close'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
