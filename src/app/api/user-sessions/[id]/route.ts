import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { feedback } = await request.json()

    if (!feedback) {
      return NextResponse.json(
        { error: 'Feedback is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('sessionToUser')
      .update({ feedback })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user session:', error)
      return NextResponse.json(
        { error: 'Failed to update user session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ userSession: data })

  } catch (error) {
    console.error('Error updating user session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
