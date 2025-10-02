import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

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
  average: number
}

export function useChartData() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [hasEnoughSessions, setHasEnoughSessions] = useState(false)

  useEffect(() => {
    if (user) {
      loadAllSessions()
    }
  }, [user])

  const loadAllSessions = async () => {
    try {
      setLoading(true)
      const allSessions: SessionData[] = []
      let page = 1
      let hasMore = true

      while (hasMore) {
        const { sessionToUser, pagination } = await api.sessionToUser.getAll({
          page,
          limit: 100 // Get more per page to reduce API calls
        })
        
        allSessions.push(...(sessionToUser as SessionData[]))
        hasMore = pagination.hasNext
        page++
      }

      setSessions(allSessions)
      setHasEnoughSessions(allSessions.length >= 2)
    } catch (error) {
      console.error('Error loading sessions for charts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate weekly data for oral proficiency
  const getWeeklyData = (): WeeklyData[] => {
    if (sessions.length === 0) return []

    // Group sessions by week
    const weeklyGroups: { [key: string]: SessionData[] } = {}
    
    sessions.forEach(session => {
      const date = new Date(session.created_at)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
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
  const getPISAData = (): PISAData[] => {
    if (sessions.length === 0) return []

    // Get first day data (earliest session)
    const firstSession = sessions
      .filter(s => 
        s.pisa_shared_understanding !== null && 
        s.pisa_problem_solving_action !== null && 
        s.pisa_team_organization !== null
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]

    // Calculate averages for all sessions
    const validSessions = sessions.filter(s => 
      s.pisa_shared_understanding !== null && 
      s.pisa_problem_solving_action !== null && 
      s.pisa_team_organization !== null
    )

    if (!firstSession || validSessions.length === 0) return []

    const avgShared = validSessions.reduce((sum, s) => sum + (s.pisa_shared_understanding || 0), 0) / validSessions.length
    const avgProblem = validSessions.reduce((sum, s) => sum + (s.pisa_problem_solving_action || 0), 0) / validSessions.length
    const avgTeam = validSessions.reduce((sum, s) => sum + (s.pisa_team_organization || 0), 0) / validSessions.length

    return [
      {
        scale: 'C',
        firstDay: firstSession.pisa_shared_understanding || 0,
        average: Math.round(avgShared * 10) / 10
      },
      {
        scale: 'P',
        firstDay: firstSession.pisa_problem_solving_action || 0,
        average: Math.round(avgProblem * 10) / 10
      },
      {
        scale: 'S',
        firstDay: firstSession.pisa_team_organization || 0,
        average: Math.round(avgTeam * 10) / 10
      }
    ]
  }

  return {
    sessions,
    loading,
    hasEnoughSessions,
    weeklyData: getWeeklyData(),
    pisaData: getPISAData()
  }
}