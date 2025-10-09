'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Ratings } from '@/components/rating'
import { Calendar, MessageSquare, BarChart3 } from 'lucide-react'
import { ParticipationLog } from './ParticipationLogTable'

interface ParticipationLogDetailModalProps {
  isOpen: boolean
  onClose: () => void
  participationLog: ParticipationLog | null
}

export function ParticipationLogDetailModal({
  isOpen,
  onClose,
  participationLog,
}: ParticipationLogDetailModalProps) {
  if (!participationLog) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl min-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">
                {participationLog.sessionName}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Participation Log Details
              </DialogDescription>
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(participationLog.createdAt)}</span>
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Session Information
              </h4>
              <p className="text-sm text-gray-700">
                <strong>Session ID:</strong> {participationLog.sessionId}
              </p>
              <p className="text-sm text-gray-700">
                <strong>User ID:</strong> {participationLog.userId}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                User Information
              </h4>
              <p className="text-sm text-gray-700">
                <strong>Full Name:</strong> {participationLog.userFullName}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Participation ID:</strong> {participationLog.id}
              </p>
            </div>
          </div>

          {/* Performance Metrics */}
          {(participationLog.words_per_min !== null ||
            participationLog.filler_words_per_min !== null ||
            participationLog.participation_percentage !== null ||
            participationLog.duration !== null) && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                <h4 className="font-semibold text-gray-900">Oral Production</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {participationLog.words_per_min !== null && (
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-600 mb-1">WPM</div>
                    <p className="text-lg font-bold text-gray-900">
                      {participationLog.words_per_min}
                    </p>
                  </div>
                )}
                {participationLog.filler_words_per_min !== null && (
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-600 mb-1">
                      Fillers/min
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {participationLog.filler_words_per_min}
                    </p>
                  </div>
                )}
                {participationLog.participation_percentage !== null && (
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-600 mb-1">
                      % of Speaking Time
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {participationLog.participation_percentage}%
                    </p>
                  </div>
                )}
                {participationLog.duration !== null && (
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-600 mb-1">Duration</div>
                    <p className="text-lg font-bold text-gray-900">
                      {participationLog.duration}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PISA Scores */}
          {(participationLog.pisa_shared_understanding !== null ||
            participationLog.pisa_problem_solving_action !== null ||
            participationLog.pisa_team_organization !== null) && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                PISA Collaborative Problem Solving
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {participationLog.pisa_shared_understanding !== null && (
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">
                      Establishing and Maintaining a Shared Understanding
                    </div>
                    <div className="flex justify-center">
                      <Ratings
                        rating={
                          participationLog?.pisa_shared_understanding || 0
                        }
                        totalStars={4}
                        size={16}
                        variant="yellow"
                      />
                    </div>
                  </div>
                )}
                {participationLog.pisa_problem_solving_action !== null && (
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">
                      Taking Appropriate Action to Solve the Problem
                    </div>
                    <div className="flex justify-center">
                      <Ratings
                        rating={
                          participationLog?.pisa_problem_solving_action || 0
                        }
                        totalStars={4}
                        size={16}
                        variant="yellow"
                      />
                    </div>
                  </div>
                )}
                {participationLog.pisa_team_organization !== null && (
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">
                      Establishing and Maintaining Team Organization
                    </div>
                    <div className="flex justify-center">
                      <Ratings
                        rating={participationLog?.pisa_team_organization || 0}
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

          {/* Big Picture Thinking */}
          {participationLog.feedback?.big_picture_thinking &&
            participationLog.feedback.big_picture_thinking.length > 0 && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-200 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <h4 className="text-xl font-bold text-indigo-800">
                    🌐 Big Picture Thinking
                  </h4>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-indigo-700 font-medium mb-3">
                    Also, think about the bigger context next time — for
                    example:
                  </p>
                  <ul className="space-y-2">
                    {participationLog.feedback.big_picture_thinking.map(
                      (item, index) => (
                        <li
                          key={index}
                          className="text-sm ml-3 text-gray-800 flex items-start"
                        >
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {item}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            )}

          {/* Feedback */}
          {participationLog.feedback !== null && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">AI Feedback</h4>

              {participationLog.feedback.strengths &&
                participationLog.feedback.strengths.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-medium text-green-700">
                        👍 What you did well
                      </h5>
                    </div>
                    <ul className="space-y-1 pl-6">
                      {participationLog.feedback.strengths.map(
                        (strength, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-700 flex items-start"
                          >
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {strength}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

              {participationLog.feedback.improvements &&
                participationLog.feedback.improvements.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-medium text-orange-700">
                        🔧 What to work on
                      </h5>
                    </div>
                    <ul className="space-y-1 pl-6">
                      {participationLog.feedback.improvements.map(
                        (improvement, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-700 flex items-start"
                          >
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {improvement}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

              {participationLog.feedback.tips &&
                participationLog.feedback.tips.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-medium text-blue-700">
                        💡 Tips for next time
                      </h5>
                    </div>
                    <ul className="space-y-1 pl-6">
                      {participationLog.feedback.tips.map((tip, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-700 flex items-start"
                        >
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}

          {/* Reflection */}
          {participationLog.reflection !== null && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <MessageSquare className="h-4 w-4 text-purple-500" />
                <h5 className="font-medium text-purple-700">User Reflection</h5>
              </div>
              <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded-lg">
                {participationLog.reflection}
              </p>
            </div>
          )}

          {/* User Question or Feedback */}
          {participationLog.user_question_or_feedback !== null && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <h5 className="font-medium text-blue-700">
                  User Question or Feedback
                </h5>
              </div>
              <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                {participationLog.user_question_or_feedback}
              </p>
            </div>
          )}

          {/* Transcript */}
          {participationLog.transcriptUrl && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                <h5 className="font-medium text-green-700">Transcript</h5>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <a
                  href={participationLog.transcriptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-700 hover:text-green-800 underline"
                >
                  View Transcript
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
