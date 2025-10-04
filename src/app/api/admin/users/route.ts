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
  roleId?: string
}

interface UserData {
  userId: string
  displayName: string
  email: string
  ieltsScore: string
  sessionParticipationCount: number
  roles: string[]
  createdAt: string
}

interface ParticipationData {
  userId: string
}

interface UserRoleData {
  userId: string
  roles: { name: string } | { name: string }[]
}

interface UserProfileData {
  user_id: string
  full_name: string
  ielts_score: string
  created_at: string
}

interface AuthUserData {
  id: string
  email: string
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
    roleId: searchParams.get('roleId') || undefined,
  }
}


async function getTotalCount(params: QueryParams, userIds?: string[]) {
  let countQuery = supabaseAdmin
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })

  // Apply search filter
  if (params.search) {
    countQuery = countQuery.ilike('full_name', `%${params.search}%`)
  }

  // Apply role filter
  if (userIds) {
    countQuery = countQuery.in('user_id', userIds)
  }

  const { count, error } = await countQuery
  if (error) {
    throw new Error('Failed to get total count')
  }

  return count || 0
}

async function fetchUserData(userIds: string[]) {
  // Fetch auth users data
  const { data: authUsers, error: authError } = await supabaseAdmin
    .rpc('get_auth_users', { user_ids: userIds })

  if (authError) {
    throw new Error('Failed to fetch auth users')
  }

  // Fetch user roles
  const { data: userRoles, error: rolesError } = await supabaseAdmin
    .from('roleToUser')
    .select(`
      userId,
      roles:roleId (
        name
      )
    `)
    .in('userId', userIds)

  if (rolesError) {
    throw new Error('Failed to fetch user roles')
  }

  // Fetch participation counts
  const { data: participationCounts, error: participationError } = await supabaseAdmin
    .from('participation_log')
    .select('userId')
    .in('userId', userIds)

  if (participationError) {
    throw new Error('Failed to fetch participation counts')
  }

  return { authUsers, userRoles, participationCounts }
}

function createDataMaps(userRoles: UserRoleData[], participationCounts: ParticipationData[]) {
  // Create participation map
  const participationMap = new Map<string, number>()
  participationCounts?.forEach((participation: ParticipationData) => {
    const count = participationMap.get(participation.userId) || 0
    participationMap.set(participation.userId, count + 1)
  })

  // Create roles map
  const rolesMap = new Map<string, string[]>()
  userRoles?.forEach((userRole: UserRoleData) => {
    const existingRoles = rolesMap.get(userRole.userId) || []
    // Handle both array and single object cases
    if (Array.isArray(userRole.roles)) {
      userRole.roles.forEach((role: { name: string }) => {
        if (role.name && !existingRoles.includes(role.name)) {
          existingRoles.push(role.name)
        }
      })
    } else if (userRole.roles?.name && !existingRoles.includes(userRole.roles.name)) {
      existingRoles.push(userRole.roles.name)
    }
    if (existingRoles.length > 0) {
      rolesMap.set(userRole.userId, existingRoles)
    }
  })

  return { participationMap, rolesMap }
}

function transformUserData(
  userProfiles: UserProfileData[],
  authUsers: AuthUserData[],
  participationMap: Map<string, number>,
  rolesMap: Map<string, string[]>
): UserData[] {
  return userProfiles.map((profile: UserProfileData) => {
    const authUser = authUsers?.find((au: AuthUserData) => au.id === profile.user_id)
    const roles = rolesMap.get(profile.user_id) || []
    const sessionParticipationCount = participationMap.get(profile.user_id) || 0

    return {
      userId: profile.user_id,
      displayName: profile.full_name || 'No name',
      email: authUser?.email || 'No email',
      ieltsScore: profile.ielts_score || 'N/A',
      sessionParticipationCount,
      roles,
      createdAt: profile.created_at,
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Parse query parameters
    const params = parseQueryParams(request)
    const offset = (params.page - 1) * params.limit

    // Handle role filtering first
    let userIds: string[] | null = null
    if (params.roleId) {
      const { data: roleUsers, error: roleError } = await supabaseAdmin
        .from('roleToUser')
        .select('userId')
        .eq('roleId', params.roleId)

      if (roleError) {
        throw new Error('Failed to fetch role users')
      }

      userIds = roleUsers?.map(ru => ru.userId) || []
      if (userIds.length === 0) {
        // No users with this role, return empty result
        return NextResponse.json({
          users: [],
          pagination: {
            page: params.page,
            limit: params.limit,
            total: 0,
            totalPages: 0,
          },
        })
      }
    }

    // Build user profiles query
    let userProfilesQuery = supabaseAdmin
      .from('user_profiles')
      .select(`
        user_id,
        full_name,
        ielts_score,
        created_at
      `)

    // Apply search filter
    if (params.search) {
      userProfilesQuery = userProfilesQuery.ilike('full_name', `%${params.search}%`)
    }

    // Apply role filter
    if (userIds) {
      userProfilesQuery = userProfilesQuery.in('user_id', userIds)
    }

    // Get total count
    const totalCount = await getTotalCount(params, userIds || undefined)

    // Apply sorting and pagination
    const validSortFields = ['created_at', 'full_name', 'ielts_score', 'session_participation_count']
    let sortField = validSortFields.includes(params.sortBy) ? params.sortBy : 'created_at'
    const sortDirection = params.sortOrder === 'asc' ? { ascending: true } : { ascending: false }
    
    // Handle session participation count sorting differently since it's calculated
    if (sortField === 'session_participation_count') {
      // For now, just sort by created_at and we'll sort by participation count in memory
      sortField = 'created_at'
    }
    
    const { data: userProfiles, error: profilesError } = await userProfilesQuery
      .order(sortField, sortDirection)
      .range(offset, offset + params.limit - 1)

    if (profilesError) {
      throw new Error('Failed to fetch user profiles')
    }

    if (!userProfiles || userProfiles.length === 0) {
      return NextResponse.json({
        users: [],
        pagination: {
          page: params.page,
          limit: params.limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / params.limit),
        },
      })
    }

    // Fetch additional user data
    const profileUserIds = userProfiles.map((profile: UserProfileData) => profile.user_id)
    const { authUsers, userRoles, participationCounts } = await fetchUserData(profileUserIds)

    // Create data maps
    const { participationMap, rolesMap } = createDataMaps(userRoles, participationCounts)

    // Transform data
    let users = transformUserData(userProfiles, authUsers, participationMap, rolesMap)

    // Sort by session participation count if requested (in memory)
    if (params.sortBy === 'session_participation_count') {
      users = users.sort((a, b) => {
        const aCount = a.sessionParticipationCount
        const bCount = b.sessionParticipationCount
        return params.sortOrder === 'asc' ? aCount - bCount : bCount - aCount
      })
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / params.limit)

    return NextResponse.json({
      users,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalCount,
        totalPages,
      },
    })

  } catch (error) {
    console.error('Get users API error:', error)
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
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { email, password, fullName, ieltsScore, role = 'USER' } = body

    // Validate required fields
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters long' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['USER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be either USER or ADMIN' },
        { status: 400 }
      )
    }

    // Create user in auth.users with auto-confirm
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError || !newUser.user) {
      console.error('Error creating user:', createError)
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    const userId = newUser.user.id

    // Get the role ID for the selected role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', role)
      .single()

    if (roleError || !roleData) {
      console.error('Error fetching role:', roleError)
      return NextResponse.json(
        { error: 'Failed to fetch role information' },
        { status: 500 }
      )
    }

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert([
        {
          user_id: userId,
          full_name: fullName,
          ielts_score: ieltsScore || null,
        },
      ])

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      // Clean up the created user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // Check if user already has a role (prevent duplicates)
    const { data: existingRole, error: checkError } = await supabaseAdmin
      .from('roleToUser')
      .select('id')
      .eq('userId', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing role:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing role' },
        { status: 500 }
      )
    }

    if (existingRole) {
      console.error('User already has a role assigned:', userId)
      // Clean up the created user and profile
      await supabaseAdmin.from('user_profiles').delete().eq('user_id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'User already has a role assigned' },
        { status: 400 }
      )
    }

    // Assign role to user
    const { error: roleAssignError } = await supabaseAdmin
      .from('roleToUser')
      .insert([
        {
          userId: userId,
          roleId: roleData.id,
        },
      ])

    if (roleAssignError) {
      console.error('Error assigning role:', roleAssignError)
      // Clean up the created user and profile if role assignment fails
      await supabaseAdmin.from('user_profiles').delete().eq('user_id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Failed to assign role to user' },
        { status: 500 }
      )
    }

    console.log(`User ${email} created successfully by admin ${user.email}`)

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: userId,
        email,
        fullName,
        ieltsScore: ieltsScore || null,
        role,
      }
    })

  } catch (error) {
    console.error('Create user API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}