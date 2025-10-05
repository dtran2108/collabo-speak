import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../lib/supabase'
import { isAdmin } from '../../lib/admin-utils'

export async function GET(request: NextRequest) {
  try {
    // Get user from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 },
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user has admin role
    const adminCheck = await isAdmin(user.id)
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 },
      )
    }

    // Fetch comprehensive admin statistics
    const [
      { count: totalUsers },
      { count: totalSessions },
      { count: totalParticipation },
      { count: recentActivity },
      { count: totalPersonas },
      { count: readySessions },
      { count: notReadySessions },
      participationData,
      userEngagementData,
      timeSeriesData,
      sessionDistribution,
    ] = await Promise.all([
      // Total users
      supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true }),

      // Total sessions
      supabaseAdmin
        .from('sessions')
        .select('*', { count: 'exact', head: true }),

      // Total participation records
      supabaseAdmin
        .from('participation_log')
        .select('*', { count: 'exact', head: true }),

      // Recent activity (last 24 hours)
      supabaseAdmin
        .from('participation_log')
        .select('*', { count: 'exact', head: true })
        .gte(
          'created_at',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        ),

      // Total personas
      supabaseAdmin
        .from('personas')
        .select('*', { count: 'exact', head: true }),

      // Ready sessions
      supabaseAdmin
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('isReady', true),

      // Not ready sessions
      supabaseAdmin
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('isReady', false),

      // Participation data with performance metrics
      supabaseAdmin
        .from('participation_log')
        .select(`
          words_per_min,
          filler_words_per_min,
          participation_percentage,
          pisa_shared_understanding,
          pisa_problem_solving_action,
          pisa_team_organization,
          created_at
        `)
        .not('words_per_min', 'is', null)
        .not('participation_percentage', 'is', null),

      // User engagement data
      supabaseAdmin
        .from('participation_log')
        .select(`
          userId,
          created_at,
          sessions!inner(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100),

      // Performance metrics for charts (removed unused variable)
      supabaseAdmin
        .from('participation_log')
        .select(`
          words_per_min,
          filler_words_per_min,
          participation_percentage,
          pisa_shared_understanding,
          pisa_problem_solving_action,
          pisa_team_organization
        `)
        .not('words_per_min', 'is', null),

      // Time series data for trends (last 30 days)
      supabaseAdmin
        .from('participation_log')
        .select('created_at')
        .gte(
          'created_at',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        )
        .order('created_at', { ascending: true }),

      // Session distribution
      supabaseAdmin
        .from('participation_log')
        .select(`
          sessionId,
          sessions!inner(name)
        `)
        .limit(50),
    ])

    // Process performance metrics
    const participationDataArray = participationData?.data || []
    const avgWPM = participationDataArray.length > 0 
      ? participationDataArray.reduce((sum, p) => sum + (p.words_per_min || 0), 0) / participationDataArray.length 
      : 0

    const avgParticipation = participationDataArray.length > 0
      ? participationDataArray.reduce((sum, p) => sum + (p.participation_percentage || 0), 0) / participationDataArray.length
      : 0

    const avgPISAShared = participationDataArray.length > 0
      ? participationDataArray.reduce((sum, p) => sum + (p.pisa_shared_understanding || 0), 0) / participationDataArray.length
      : 0

    const avgPISAProblem = participationDataArray.length > 0
      ? participationDataArray.reduce((sum, p) => sum + (p.pisa_problem_solving_action || 0), 0) / participationDataArray.length
      : 0

    const avgPISAOrganization = participationDataArray.length > 0
      ? participationDataArray.reduce((sum, p) => sum + (p.pisa_team_organization || 0), 0) / participationDataArray.length
      : 0

    // Process time series data
    const timeSeries = timeSeriesData?.data?.reduce((acc, item) => {
      const created_at = (item as unknown as { created_at: string }).created_at
      if (!created_at) return acc
      
      const date = new Date(created_at)
      if (isNaN(date.getTime())) {
        console.warn('Invalid date found:', created_at)
        return acc
      }
      
      const dateString = date.toISOString().split('T')[0]
      acc[dateString] = (acc[dateString] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const timeSeriesArray = Object.entries(timeSeries).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0
      return dateA.getTime() - dateB.getTime()
    })

    // Process session distribution
    const sessionDistributionData = sessionDistribution?.data?.reduce((acc, item) => {
      const sessions = (item as unknown as { sessions: { name?: string } }).sessions
      if (!sessions) return acc
      
      const sessionName = sessions.name || 'Unknown Session'
      acc[sessionName] = (acc[sessionName] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const sessionDistributionArray = Object.entries(sessionDistributionData).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count).slice(0, 10)

    const stats = {
      totalUsers: totalUsers || 0,
      totalSessions: totalSessions || 0,
      totalParticipation: totalParticipation || 0,
      recentActivity: recentActivity || 0,
      totalPersonas: totalPersonas || 0,
      readySessions: readySessions || 0,
      notReadySessions: notReadySessions || 0,
      performanceMetrics: {
        avgWPM: Math.round(avgWPM * 10) / 10,
        avgParticipation: Math.round(avgParticipation * 10) / 10,
        avgPISAShared: Math.round(avgPISAShared * 10) / 10,
        avgPISAProblem: Math.round(avgPISAProblem * 10) / 10,
        avgPISAOrganization: Math.round(avgPISAOrganization * 10) / 10,
      },
      timeSeries: timeSeriesArray,
      sessionDistribution: sessionDistributionArray,
      userEngagement: userEngagementData?.data || [],
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Admin stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
