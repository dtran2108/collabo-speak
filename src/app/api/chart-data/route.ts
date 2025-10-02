import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface SessionData {
  id: string
  sessionId: string
  userId: string
  transcriptUrl: string | null
  reflection: string | null
  feedback: {
    strengths: string[]
    improvements: string[]
    tips: string[]
  } | null
  words_per_min: number | null
  filler_words_per_min: number | null
  participation_percentage: number | null
  duration: string | null
  pisa_shared_understanding: number | null
  pisa_problem_solving_action: number | null
  pisa_team_organization: number | null
  created_at: string
  sessions: {
    id: string
    name: string
    description: string
    agentId: string
    isReady: boolean | null
  }
}

interface WeeklyData {
  week: string
  wpm: number
  fillers: number
  participation: number
}

interface PISAData {
  scale: string
  firstDay: number
  lastDay: number
}

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

    // Fetch all user sessions
    const allSessions: SessionData[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase
        .from('participation_log')
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
        .range((page - 1) * 100, page * 100 - 1)

      if (error) {
        console.error('Error fetching user sessions:', error)
        return NextResponse.json(
          { error: 'Failed to fetch user sessions' },
          { status: 500 }
        )
      }

      if (data && data.length > 0) {
        allSessions.push(...(data as SessionData[]))
        page++
      } else {
        hasMore = false
      }
    }

    // Calculate chart data
    const hasEnoughSessions = allSessions.length >= 2
    const weeklyData = calculateWeeklyData(allSessions)
    const pisaData = calculatePISAData(allSessions)

    return NextResponse.json({
      hasEnoughSessions,
      weeklyData,
      pisaData,
      totalSessions: allSessions.length
    })
  } catch (error) {
    console.error('Chart data API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get week start date (Sunday)
function getWeekStartDate(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday, then back to Sunday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Calculate weekly data for oral proficiency
function calculateWeeklyData(sessions: SessionData[]): WeeklyData[] {
  if (sessions.length === 0) return []

  // Group sessions by week
  const weeklyGroups: { [key: string]: SessionData[] } = {}
  
  sessions.forEach(session => {
    const date = new Date(session.created_at)
    const weekStart = getWeekStartDate(date)
    const weekKey = weekStart.toISOString().split('T')[0]
    
    if (!weeklyGroups[weekKey]) {
      weeklyGroups[weekKey] = []
    }
    weeklyGroups[weekKey].push(session)
  })

  // Calculate averages for each week
  const weeklyData = Object.entries(weeklyGroups)
    .map(([week, weekSessions]) => {
      const validSessions = weekSessions.filter(s => 
        s.words_per_min !== null && 
        s.filler_words_per_min !== null && 
        s.participation_percentage !== null
      )

      if (validSessions.length === 0) return null

      const avgWpm = Math.round(
        validSessions.reduce((sum, s) => sum + (s.words_per_min || 0), 0) / validSessions.length
      )
      const avgFillers = Math.round(
        validSessions.reduce((sum, s) => sum + (s.filler_words_per_min || 0), 0) / validSessions.length
      )
      const avgParticipation = Math.round(
        validSessions.reduce((sum, s) => sum + (s.participation_percentage || 0), 0) / validSessions.length
      )

      return {
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        wpm: avgWpm,
        fillers: avgFillers,
        participation: avgParticipation
      }
    })
    .filter(Boolean) as WeeklyData[]

  return weeklyData.sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
}

// Calculate PISA data for radar chart
function calculatePISAData(sessions: SessionData[]): PISAData[] {
  if (sessions.length === 0) return []

  // Get valid sessions with PISA data
  const validSessions = sessions.filter(s => 
    s.pisa_shared_understanding !== null && 
    s.pisa_problem_solving_action !== null && 
    s.pisa_team_organization !== null
  )

  if (validSessions.length === 0) return []

  // Sort by creation date to get first and last sessions
  const sortedSessions = validSessions.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const firstSession = sortedSessions[0]
  const lastSession = sortedSessions[sortedSessions.length - 1]

  return [
    {
      scale: 'C',
      firstDay: firstSession.pisa_shared_understanding || 0,
      lastDay: lastSession.pisa_shared_understanding || 0
    },
    {
      scale: 'P',
      firstDay: firstSession.pisa_problem_solving_action || 0,
      lastDay: lastSession.pisa_problem_solving_action || 0
    },
    {
      scale: 'S',
      firstDay: firstSession.pisa_team_organization || 0,
      lastDay: lastSession.pisa_team_organization || 0
    }
  ]
}
