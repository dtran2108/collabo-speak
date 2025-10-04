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

    // Fetch admin statistics
    const [
      { count: totalUsers },
      { count: totalSessions },
      { count: totalParticipation },
      { count: recentActivity },
    ] = await Promise.all([
      // Total users
      supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true }),

      // Total sessions
      supabaseAdmin
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('isReady', true),

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
    ])

    const stats = {
      totalUsers: totalUsers || 0,
      totalSessions: totalSessions || 0,
      totalParticipation: totalParticipation || 0,
      recentActivity: recentActivity || 0,
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
