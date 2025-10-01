import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting sessions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sessions: data || [] })
  } catch (error) {
    console.error('Sessions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
