import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CheckCircle,
  Target,
  Lightbulb,
  Loader,
} from 'lucide-react'

interface EvaluationData {
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
            <Loader className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-muted-foreground text-center">
              AI is analyzing your conversation...
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 max-w-md">
              <div className="flex items-center justify-center space-x-2">
                <p className="text-sm font-semibold text-amber-800 text-center">
                  ⚠️ Please do NOT close this window until the analysis is
                  complete
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Performance Metrics - Compact at the top */}
            {(data?.words_per_min ||
              data?.filler_words_per_min ||
              data?.participation_percentage ||
              data?.duration) && (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-3 pl-7">
                  {data?.words_per_min !== null && (
                    <div className="bg-gray-50 p-2 rounded-md text-center">
                      <div className="text-xs text-gray-600 mb-1">WPM</div>
                      <p className="text-sm font-bold text-gray-900">
                        {data.words_per_min}
                      </p>
                    </div>
                  )}

                  {data?.filler_words_per_min !== null && (
                    <div className="bg-gray-50 p-2 rounded-md text-center">
                      <div className="text-xs text-gray-600 mb-1">
                        Fillers/min
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        {data.filler_words_per_min}
                      </p>
                    </div>
                  )}

                  {data?.participation_percentage !== null && (
                    <div className="bg-gray-50 p-2 rounded-md text-center">
                      <div className="text-xs text-gray-600 mb-1">
                        Participation
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        {data.participation_percentage}%
                      </p>
                    </div>
                  )}

                  {data?.duration !== null && (
                    <div className="bg-gray-50 p-2 rounded-md text-center">
                      <div className="text-xs text-gray-600 mb-1">Duration</div>
                      <p className="text-sm font-bold text-gray-900">
                        {data.duration}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                <Loader className="mr-2 h-4 w-4 animate-spin" />
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
