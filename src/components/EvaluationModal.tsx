import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader } from 'lucide-react'
import { Ratings } from './rating'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface EvaluationData {
  strengths: string[]
  improvements: string[]
  tips: string[]
  objectives: string[]
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
  userSessionId?: string
}

export function EvaluationModal({
  isOpen,
  onClose,
  evaluationData,
  isLoading = false,
  userSessionId,
}: EvaluationModalProps) {
  const data = evaluationData
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClose = async () => {
    if (feedback.trim() !== '' && userSessionId) {
      try {
        setIsSubmitting(true)
        // Update the participation log with user feedback
        await api.participationLog.update(userSessionId, {
          user_question_or_feedback: feedback.trim(),
        } as unknown as JSON)
        toast.success('Thanks for your feedback!')
      } catch (error) {
        console.error('Error saving feedback:', error)
        toast.error('Failed to save feedback')
      } finally {
        setIsSubmitting(false)
      }
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
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
              Your session is being evaluated...
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pl-7">
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
                        % of Speaking Time
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

            {/* PISA Scores */}
            {(data?.pisa_shared_understanding !== null ||
              data?.pisa_problem_solving_action !== null ||
              data?.pisa_team_organization !== null) && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  PISA Collaborative Problem Solving
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data?.pisa_shared_understanding !== null && (
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">
                        Establishing and Maintaining a Shared Understanding
                      </div>
                      <div className="flex justify-center">
                        <Ratings
                          rating={data?.pisa_shared_understanding || 0}
                          totalStars={4}
                          size={16}
                          variant="yellow"
                        />
                      </div>
                    </div>
                  )}
                  {data?.pisa_problem_solving_action !== null && (
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">
                        Taking Appropriate Action to Solve the Problem
                      </div>
                      <div className="flex justify-center">
                        <Ratings
                          rating={data?.pisa_problem_solving_action || 0}
                          totalStars={4}
                          size={16}
                          variant="yellow"
                        />
                      </div>
                    </div>
                  )}
                  {data?.pisa_team_organization !== null && (
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">
                        Establishing and Maintaining Team Organization
                      </div>
                      <div className="flex justify-center">
                        <Ratings
                          rating={data?.pisa_team_organization || 0}
                          totalStars={4}
                          size={16}
                          variant="yellow"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Objectives for next time */}
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2 mb-3">
                  <h3 className="text-lg font-semibold text-purple-800">
                    🎯 The big picture
                  </h3>
                </div>
                <ul className="space-y-2">
                  {data?.objectives.map((objective, index) => (
                    <li
                      key={index}
                      className="text-sm ml-3 text-gray-800 flex items-start font-medium animate-in slide-in-from-left-2 duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <span className="text-blue-600 mr-3 mt-0.5 flex-shrink-0">
                        ⭕
                      </span>
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* What you did well */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {/* <CheckCircle className="h-5 w-5 text-green-500" /> */}
                <h3 className="text-lg font-semibold text-green-700">
                  👍 What you did well?
                </h3>
              </div>
              <ul className="space-y-2 pl-7">
                {data?.strengths.map((strength, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 flex items-start animate-in slide-in-from-left-2 duration-300"
                    style={{
                      animationDelay: `${
                        (index + (data?.objectives?.length || 0)) * 100
                      }ms`,
                    }}
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
                {/* <Target className="h-5 w-5 text-orange-500" /> */}
                <h3 className="text-lg font-semibold text-orange-700">
                  🔧 What to work on?
                </h3>
              </div>
              <ul className="space-y-2 pl-7">
                {data?.improvements.map((improvement, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 flex items-start animate-in slide-in-from-left-2 duration-300"
                    style={{
                      animationDelay: `${
                        (index +
                          (data?.objectives?.length || 0) +
                          data?.strengths.length) *
                        100
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
                {/* <Lightbulb className="h-5 w-5 text-blue-500" /> */}
                <h3 className="text-lg font-semibold text-blue-700">
                  💡 Tips for next time
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
                          (data?.objectives?.length || 0) +
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

        {/* User Feedback Section */}
        <div className=" p-4 rounded-lg">
          <Textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Any question or feedback"
            className="min-h-[80px] resize-none"
            disabled={isLoading || isSubmitting}
          />
        </div>

        <div className="flex justify-center pt-4">
          <Button
            onClick={handleClose}
            className="px-8"
            disabled={isLoading || isSubmitting}
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : isSubmitting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Saving...
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
