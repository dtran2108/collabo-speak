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

    // Get session IDs from query parameters
    const { searchParams } = new URL(request.url)
    const sessionIds = searchParams.get('sessionIds')
    
    if (!sessionIds) {
      return NextResponse.json(
        { error: 'Session IDs are required' },
        { status: 400 }
      )
    }

    // Parse session IDs (comma-separated)
    const sessionIdArray = sessionIds.split(',').filter(id => id.trim())

    if (sessionIdArray.length === 0) {
      return NextResponse.json({ participation: {} })
    }

    // Query to get user's participation in the specified sessions
    const { data, error } = await supabase
      .from('sessionToUser')
      .select('sessionId')
      .eq('userId', user.id)
      .in('sessionId', sessionIdArray)

    if (error) {
      console.error('Error checking session participation:', error)
      return NextResponse.json(
        { error: 'Failed to check session participation' },
        { status: 500 }
      )
    }

    // Create a map of sessionId -> hasParticipated
    const participation: { [sessionId: string]: boolean } = {}
    
    // Initialize all sessions as not participated
    sessionIdArray.forEach(sessionId => {
      participation[sessionId] = false
    })
    
    // Mark sessions where user has participated
    data?.forEach(record => {
      participation[record.sessionId] = true
    })

    return NextResponse.json({ participation })
  } catch (error) {
    console.error('Session participation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
