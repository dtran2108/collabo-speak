import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    const { data, error } = await supabase
      .from('sessionToUser')
      .update({
        feedback: {
          strengths: AIFeedback.strengths,
          improvements: AIFeedback.improvements,
          tips: AIFeedback.tips,
        },
        words_per_min: AIFeedback.words_per_min,
        filler_words_per_min: AIFeedback.filler_words_per_min,
        participation_percentage: AIFeedback.participation_percentage,
        duration: AIFeedback.duration,
        pisa_shared_understanding: AIFeedback.pisa_shared_understanding,
        pisa_problem_solving_action: AIFeedback.pisa_problem_solving_action,
        pisa_team_organization: AIFeedback.pisa_team_organization,
      })
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
