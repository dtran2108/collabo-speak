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

interface PersonaData {
  id: string
  createdAt: string
  name: string
  description: string
  sessionId: string
  sessionName: string
  avatarUrl: string
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
    .from('personas')
    .select('*', { count: 'exact', head: true })

  // Apply search filter
  if (params.search) {
    countQuery = countQuery.ilike('name', `%${params.search}%`)
  }

  // Apply sessionId filter
  if (params.sessionId && params.sessionId !== 'all') {
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

    // Build personas query with session join
    let personasQuery = supabaseAdmin.from('personas').select(`
        id,
        created_at,
        name,
        description,
        sessionId,
        avatarUrl,
        sessions(
          id,
          name
        )
      `)

    // Apply search filter
    if (params.search) {
      personasQuery = personasQuery.ilike('name', `%${params.search}%`)
    }

    // Apply sessionId filter
    if (params.sessionId && params.sessionId !== 'all') {
      personasQuery = personasQuery.eq('sessionId', params.sessionId)
    }

    // Apply sorting
    const validSortFields = ['created_at', 'name', 'sessionId']
    const sortField = validSortFields.includes(params.sortBy) ? params.sortBy : 'created_at'
    const sortDirection = params.sortOrder === 'asc' ? { ascending: true } : { ascending: false }

    // Apply pagination
    const { data: personas, error } = await personasQuery
      .order(sortField, sortDirection)
      .range(offset, offset + params.limit - 1)

    if (error) {
      throw new Error('Failed to fetch personas')
    }

    // Debug: Log the raw data to see what we're getting
    console.log('Raw personas data:', JSON.stringify(personas, null, 2))

    // Transform data
    const transformedPersonas: PersonaData[] = (personas || []).map((persona) => {
      console.log('Processing persona:', persona.name, 'sessions:', persona.sessions)
      return {
        id: persona.id,
        createdAt: persona.created_at,
        name: persona.name,
        description: persona.description || '',
        sessionId: persona.sessionId,
        sessionName: persona.sessions?.name || 'No Session',
        avatarUrl: persona.avatarUrl || '',
      }
    })

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / params.limit)

    return NextResponse.json({
      personas: transformedPersonas,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalCount,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Get personas API error:', error)
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
    const { name, description, sessionId, avatarUrl = '' } = body

    // Validate required fields
    if (!name || !description || !sessionId) {
      return NextResponse.json(
        { error: 'Name, description, and sessionId are required' },
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

    // Validate sessionId exists
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 400 },
      )
    }

    // Validate avatarUrl if provided
    if (avatarUrl && avatarUrl.trim() !== '') {
      try {
        new URL(avatarUrl)
      } catch {
        return NextResponse.json(
          { error: 'Avatar URL must be a valid URL' },
          { status: 400 },
        )
      }
    }

    // Create persona
    const { data: newPersona, error: createError } = await supabaseAdmin
      .from('personas')
      .insert([
        {
          name,
          description,
          sessionId,
          avatarUrl: avatarUrl || null,
        },
      ])
      .select()
      .single()

    if (createError || !newPersona) {
      console.error('Error creating persona:', createError)
      return NextResponse.json(
        { error: 'Failed to create persona' },
        { status: 500 },
      )
    }

    console.log(`Persona ${name} created successfully by admin ${authResult.user.email}`)

    return NextResponse.json({
      message: 'Persona created successfully',
      persona: {
        id: newPersona.id,
        name: newPersona.name,
        description: newPersona.description,
        sessionId: newPersona.sessionId,
        avatarUrl: newPersona.avatarUrl,
        createdAt: newPersona.created_at,
      },
    })
  } catch (error) {
    console.error('Create persona API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
