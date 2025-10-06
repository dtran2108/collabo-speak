import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/api/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if authorization header is provided (optional for public access)
    const authHeader = request.headers.get('authorization')
    let user = null

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token)
      
      if (!userError && authUser) {
        user = authUser
      }
    }

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
