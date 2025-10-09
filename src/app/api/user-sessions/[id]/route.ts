import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const AIFeedback = await request.json()

    if (!AIFeedback) {
      return NextResponse.json(
        { error: 'Feedback is required' },
        { status: 400 },
      )
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}

    // Handle feedback object (only update if all feedback fields are provided)
    if (
      AIFeedback.strengths &&
      AIFeedback.improvements &&
      AIFeedback.tips &&
      AIFeedback.big_picture_thinking
    ) {
      updateData.feedback = {
        strengths: AIFeedback.strengths,
        improvements: AIFeedback.improvements,
        tips: AIFeedback.tips,
        big_picture_thinking: AIFeedback.big_picture_thinking,
      }
    }

    // Handle all other fields - only include if they exist
    const fieldsToUpdate = [
      'words_per_min',
      'filler_words_per_min',
      'participation_percentage',
      'duration',
      'pisa_shared_understanding',
      'pisa_problem_solving_action',
      'pisa_team_organization',
      'user_question_or_feedback',
    ]

    fieldsToUpdate.forEach((field) => {
      if (AIFeedback[field] !== undefined) {
        updateData[field] = AIFeedback[field]
      }
    })

    const { data, error } = await supabase
      .from('participation_log')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user session:', error)
      return NextResponse.json(
        { error: 'Failed to update user session' },
        { status: 500 },
      )
    }

    return NextResponse.json({ userSession: data })
  } catch (error) {
    console.error('Error updating user session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
