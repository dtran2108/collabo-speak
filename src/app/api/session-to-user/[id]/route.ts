import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const updateData = await request.json()

    if (!updateData) {
      return NextResponse.json(
        { error: 'Update data is required' },
        { status: 400 },
      )
    }

    // Build update object with only provided fields
    const finalUpdateData: Record<string, unknown> = {}

    // Handle feedback object (only update if all feedback fields are provided)
    if (
      updateData.strengths &&
      updateData.improvements &&
      updateData.tips &&
      updateData.big_picture_thinking
    ) {
      finalUpdateData.feedback = {
        strengths: updateData.strengths,
        improvements: updateData.improvements,
        tips: updateData.tips,
        big_picture_thinking: updateData.big_picture_thinking,
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
      'reflection',
    ]

    fieldsToUpdate.forEach((field) => {
      if (updateData[field] !== undefined) {
        finalUpdateData[field] = updateData[field]
      }
    })

    const { data, error } = await supabaseAdmin
      .from('participation_log')
      .update(finalUpdateData)
      .eq('id', id)
      .select(
        `
        *,
        sessions (
          id,
          name,
          description,
          agentId,
          isReady
        )
      `,
      )
      .single()

    if (error) {
      console.error('Error updating participation log:', error)
      return NextResponse.json(
        { error: 'Failed to update participation log' },
        { status: 500 },
      )
    }

    return NextResponse.json({ userSession: data })
  } catch (error) {
    console.error('Error updating participation log:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const { error } = await supabaseAdmin
      .from('participation_log')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting participation log:', error)
      return NextResponse.json(
        { error: 'Failed to delete participation log' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting participation log:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
