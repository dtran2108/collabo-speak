import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get user from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('userSessions')
      .select(`
        *,
        sessions (
          id,
          name,
          description,
          agentId,
          isReady
        )
      `)
      .eq('userId', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting user sessions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user sessions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ userSessions: data || [] })
  } catch (error) {
    console.error('User sessions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { sessionId, transcriptUrl, reflection } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('userSessions')
      .insert({
        sessionId,
        userId: user.id,
        transcriptUrl,
        reflection,
      })
      .select(`
        *,
        sessions (
          id,
          name,
          description,
          agentId,
          isReady
        )
      `)
      .single()

    if (error) {
      console.error('Error creating user session:', error)
      return NextResponse.json(
        { error: 'Failed to create user session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ userSession: data })
  } catch (error) {
    console.error('Create user session API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
