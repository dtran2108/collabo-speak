import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('sessionId', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error getting personas:', error)
      return NextResponse.json(
        { error: 'Failed to fetch personas' },
        { status: 500 }
      )
    }

    return NextResponse.json({ personas: data || [] })
  } catch (error) {
    console.error('Personas API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
