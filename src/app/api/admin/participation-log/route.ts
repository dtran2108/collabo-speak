import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../lib/supabase'
import { isAdmin } from '../../lib/admin-utils'

// Types
interface QueryParams {
  page: number
  limit: number
  search: string
  sortBy: string
  sortOrder: string
  sessionId?: string
}

interface ParticipationLogData {
  id: string
  createdAt: string
  sessionName: string
  userFullName: string
  transcriptUrl: string | null
  duration: string | null
  sessionId: string
  userId: string
  reflection: string | null
  user_question_or_feedback: string | null
  feedback: {
    strengths: string[]
    improvements: string[]
    tips: string[]
  } | null
  words_per_min: number | null
  filler_words_per_min: number | null
  participation_percentage: number | null
  pisa_shared_understanding: number | null
  pisa_problem_solving_action: number | null
  pisa_team_organization: number | null
}

// Helper functions
async function validateAdminAccess(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return { error: 'Authorization header required', status: 401 }
  }

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token)

  if (userError || !user) {
    return { error: 'Invalid token', status: 401 }
  }

  const adminCheck = await isAdmin(user.id)
  if (!adminCheck) {
    return { error: 'Admin access required', status: 403 }
  }

  return { user }
}

function parseQueryParams(request: NextRequest): QueryParams {
  const { searchParams } = new URL(request.url)
  return {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    search: searchParams.get('search') || '',
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: searchParams.get('sortOrder') || 'desc',
    sessionId: searchParams.get('sessionId') || undefined,
  }
}

async function getTotalCount(params: QueryParams) {
  let countQuery = supabaseAdmin
    .from('participation_log')
    .select('*', { count: 'exact', head: true })

  // Apply session filter
  if (params.sessionId) {
    countQuery = countQuery.eq('sessionId', params.sessionId)
  }

  const { count, error } = await countQuery
  if (error) {
    throw new Error('Failed to get total count')
  }

  return count || 0
}

export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      )
    }

    // Parse query parameters
    const params = parseQueryParams(request)
    const offset = (params.page - 1) * params.limit

    // Get total count
    const totalCount = await getTotalCount(params)

    // Build participation logs query with joins
    let participationLogsQuery = supabaseAdmin.from('participation_log')
      .select(`
        id,
        created_at,
        sessionId,
        userId,
        transcriptUrl,
        duration,
        reflection,
        user_question_or_feedback,
        feedback,
        words_per_min,
        filler_words_per_min,
        participation_percentage,
        pisa_shared_understanding,
        pisa_problem_solving_action,
        pisa_team_organization,
        sessions!inner(
          id,
          name
        )
      `)

    // Note: We'll handle search filtering after fetching user profiles

    // Apply session filter
    if (params.sessionId) {
      participationLogsQuery = participationLogsQuery.eq(
        'sessionId',
        params.sessionId,
      )
    }

    // Apply sorting
    const validSortFields = [
      'created_at',
      'session_name',
      'user_full_name',
      'duration',
    ]
    const sortField = validSortFields.includes(params.sortBy)
      ? params.sortBy
      : 'created_at'
    const sortDirection =
      params.sortOrder === 'asc' ? { ascending: true } : { ascending: false }

    // Apply pagination
    const { data: participationLogs, error } = await participationLogsQuery
      .order(sortField, sortDirection)
      .range(offset, offset + params.limit - 1)

    if (error) {
      throw new Error(error.message)
    }

    // Get user profiles for all userIds
    const userIds = [...new Set((participationLogs || []).map(log => log.userId))]
    let userProfiles: Record<string, { full_name: string }> = {}
    
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('user_profiles')
        .select('user_id, full_name')
        .in('user_id', userIds)
      
      if (!profilesError && profiles) {
        userProfiles = profiles.reduce((acc, profile) => {
          acc[profile.user_id] = { full_name: profile.full_name }
          return acc
        }, {} as Record<string, { full_name: string }>)
      }
    }

    // Transform data
    let transformedParticipationLogs: ParticipationLogData[] = (
      participationLogs || []
    ).map((log) => ({
      id: log.id,
      createdAt: log.created_at,
      sessionName: (log.sessions as any)?.name || 'Unknown Session',
      userFullName: userProfiles[log.userId]?.full_name || 'Unknown User',
      transcriptUrl: log.transcriptUrl,
      duration: log.duration,
      sessionId: log.sessionId,
      userId: log.userId,
      reflection: log.reflection,
      user_question_or_feedback: log.user_question_or_feedback,
      feedback: log.feedback,
      words_per_min: log.words_per_min,
      filler_words_per_min: log.filler_words_per_min,
      participation_percentage: log.participation_percentage,
      pisa_shared_understanding: log.pisa_shared_understanding,
      pisa_problem_solving_action: log.pisa_problem_solving_action,
      pisa_team_organization: log.pisa_team_organization,
    }))

    // Apply user name search filter if needed
    if (params.search) {
      const searchTerm = params.search.toLowerCase()
      transformedParticipationLogs = transformedParticipationLogs.filter(log => 
        log.sessionName.toLowerCase().includes(searchTerm) ||
        log.userFullName.toLowerCase().includes(searchTerm)
      )
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / params.limit)

    return NextResponse.json({
      participationLogs: transformedParticipationLogs,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalCount,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Get participation logs API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
