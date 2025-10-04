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
  isReady?: string
}

interface SessionData {
  id: string
  createdAt: string
  name: string
  description: string
  agentId: string
  isReady: boolean
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
    isReady: searchParams.get('isReady') || undefined,
  }
}

async function getTotalCount(params: QueryParams) {
  let countQuery = supabaseAdmin
    .from('sessions')
    .select('*', { count: 'exact', head: true })

  // Apply search filter
  if (params.search) {
    countQuery = countQuery.ilike('name', `%${params.search}%`)
  }

    // Apply isReady filter
    if (params.isReady !== undefined) {
      const isReadyValue = params.isReady === 'true'
      if (isReadyValue) {
        countQuery = countQuery.eq('isReady', true)
      } else {
        countQuery = countQuery.or('isReady.is.null,isReady.eq.false')
      }
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

    // Build sessions query
    let sessionsQuery = supabaseAdmin.from('sessions').select(`
        id,
        created_at,
        name,
        description,
        agentId,
        isReady
      `)

    // Apply search filter
    if (params.search) {
      sessionsQuery = sessionsQuery.ilike('name', `%${params.search}%`)
    }

    // Apply isReady filter
    if (params.isReady !== undefined) {
      const isReadyValue = params.isReady === 'true'
      if (isReadyValue) {
        sessionsQuery = sessionsQuery.eq('isReady', true)
      } else {
        sessionsQuery = sessionsQuery.or('isReady.is.null,isReady.eq.false')
      }
    }

    // Apply sorting
    const validSortFields = ['created_at', 'name', 'agentId', 'isReady']
    const sortField = validSortFields.includes(params.sortBy) ? params.sortBy : 'created_at'
    const sortDirection = params.sortOrder === 'asc' ? { ascending: true } : { ascending: false }

    // Apply pagination
    const { data: sessions, error } = await sessionsQuery
      .order(sortField, sortDirection)
      .range(offset, offset + params.limit - 1)

    if (error) {
      throw new Error('Failed to fetch sessions')
    }

    // Transform data
    const transformedSessions: SessionData[] = (sessions || []).map((session) => ({
      id: session.id,
      createdAt: session.created_at,
      name: session.name,
      description: session.description,
      agentId: session.agentId,
      isReady: session.isReady || false,
    }))

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / params.limit)

    return NextResponse.json({
      sessions: transformedSessions,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalCount,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Get sessions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, description, agentId, isReady = false } = body

    // Validate required fields
    if (!name || !description || !agentId) {
      return NextResponse.json(
        { error: 'Name, description, and agentId are required' },
        { status: 400 },
      )
    }

    // Validate name length
    if (name.length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long' },
        { status: 400 },
      )
    }

    // Validate description length
    if (description.length < 5) {
      return NextResponse.json(
        { error: 'Description must be at least 5 characters long' },
        { status: 400 },
      )
    }

    // Validate agentId length
    if (agentId.length < 1) {
      return NextResponse.json(
        { error: 'AgentId must not be empty' },
        { status: 400 },
      )
    }

    // Create session
    const { data: newSession, error: createError } = await supabaseAdmin
      .from('sessions')
      .insert([
        {
          name,
          description,
          agentId,
          isReady: Boolean(isReady),
        },
      ])
      .select()
      .single()

    if (createError || !newSession) {
      console.error('Error creating session:', createError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 },
      )
    }

    console.log(`Session ${name} created successfully by admin ${authResult.user.email}`)

    return NextResponse.json({
      message: 'Session created successfully',
      session: {
        id: newSession.id,
        name: newSession.name,
        description: newSession.description,
        agentId: newSession.agentId,
        isReady: newSession.isReady,
        createdAt: newSession.created_at,
      },
    })
  } catch (error) {
    console.error('Create session API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
