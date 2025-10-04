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

    // Get query parameters for pagination, sorting, and filtering
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const roleIdFilter = searchParams.get('roleId') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Get role name from roleId if filtering by role (needed for query optimization)
    let roleNameFilter = ''
    if (roleIdFilter) {
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('roles')
        .select('name')
        .eq('id', roleIdFilter)
        .single()
      
      if (roleError) {
        console.error('Error fetching role name:', roleError)
        return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 })
      }
      
      roleNameFilter = roleData?.name || ''
      console.log('Debug - roleNameFilter:', roleNameFilter)
    }

    // Build the query for users with their profiles
    let query = supabaseAdmin
      .from('user_profiles')
      .select(`
        user_id,
        full_name,
        ielts_score,
        created_at
      `)

    // If filtering by role, we need to join with roleToUser and roles tables
    if (roleNameFilter) {
      // Get the role ID first
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', roleNameFilter)
        .single()

      if (roleError || !roleData) {
        console.error('Error fetching role ID:', roleError)
        return NextResponse.json({ error: 'Invalid role name' }, { status: 400 })
      }

      console.log('Debug - roleData:', roleData)

      // Get user IDs that have this specific role
      const { data: usersWithRole, error: roleUsersError } = await supabaseAdmin
        .from('roleToUser')
        .select('userId')
        .eq('roleId', roleData.id)

      if (roleUsersError) {
        console.error('Error fetching users with role:', roleUsersError)
        return NextResponse.json({ error: 'Failed to fetch users with role' }, { status: 500 })
      }

      const userIdsWithRole = usersWithRole?.map(item => item.userId) || []
      console.log('Debug - userIdsWithRole:', userIdsWithRole)
      
      if (userIdsWithRole.length === 0) {
        // No users with this role, return empty result
        return NextResponse.json({
          users: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        })
      }

      // Filter user_profiles by these user IDs
      query = query.in('user_id', userIdsWithRole)
    }

    // Apply search filter - we'll handle email search after fetching auth users
    if (search) {
      query = query.ilike('full_name', `%${search}%`)
    }

    // Apply sorting
    if (sortBy === 'full_name') {
      query = query.order('full_name', { ascending: sortOrder === 'asc' })
    } else if (sortBy === 'ielts_score') {
      query = query.order('ielts_score', { ascending: sortOrder === 'asc' })
    } else {
      query = query.order('created_at', { ascending: sortOrder === 'asc' })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: userProfiles, error: profilesError } = await query

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    console.log('Debug - userProfiles returned:', JSON.stringify(userProfiles, null, 2))

    // Get total count for pagination (accounting for role filtering)
    let countQuery = supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
    
    // If filtering by role, apply the same filter to count query
    if (roleNameFilter) {
      // Get the role ID first (we already have this from above, but let's be safe)
      const { data: roleData } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', roleNameFilter)
        .single()

      if (roleData) {
        const { data: usersWithRole } = await supabaseAdmin
          .from('roleToUser')
          .select('userId')
          .eq('roleId', roleData.id)
        
        const userIdsWithRole = usersWithRole?.map(item => item.userId) || []
        if (userIdsWithRole.length > 0) {
          countQuery = countQuery.in('user_id', userIdsWithRole)
        } else {
          // No users with this role, count is 0
          await supabaseAdmin
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', '00000000-0000-0000-0000-000000000000') // Non-existent ID to get 0 count
          
          return NextResponse.json({
            users: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0
            }
          })
        }
      }
    }
    
    const { count: totalCount, error: countError } = await countQuery

    if (countError) {
      console.error('Error getting total count:', countError)
      return NextResponse.json(
        { error: 'Failed to get total count' },
        { status: 500 }
      )
    }

    // Get participation counts for each user
    const userIds = userProfiles?.map(profile => profile.user_id) || []
    
    // Fetch auth users data using the database function
    // Make sure to run supabase/functions/get_auth_users.sql first
    const { data: authUsers, error: authError } = await supabaseAdmin
      .rpc('get_auth_users', { user_ids: userIds })

    if (authError) {
      console.error('Error fetching auth users:', authError)
      return NextResponse.json({ error: 'Failed to fetch auth users. Make sure to run the get_auth_users.sql function.' }, { status: 500 })
    }

    // Create a map of user_id to auth user data
    const authUsersMap = authUsers?.reduce((acc: Record<string, { id: string; email: string; created_at: string }>, user: { id: string; email: string; created_at: string }) => {
      acc[user.id] = user
      return acc
    }, {} as Record<string, { id: string; email: string; created_at: string }>) || {}

    const { data: participationCounts, error: participationError } = await supabaseAdmin
      .from('participation_log')
      .select('userId')
      .in('userId', userIds)

    if (participationError) {
      console.error('Error fetching participation counts:', participationError)
      return NextResponse.json(
        { error: 'Failed to fetch participation counts' },
        { status: 500 }
      )
    }

    // Get roles for each user
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('roleToUser')
      .select(`
        userId,
        role:roles (
          name
        )
      `)
      .in('userId', userIds)

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      return NextResponse.json(
        { error: 'Failed to fetch user roles' },
        { status: 500 }
      )
    }

    console.log('Debug - userIds:', userIds)
    console.log('Debug - userRoles raw data:', JSON.stringify(userRoles, null, 2))

    // Process the data
    const participationCountMap = participationCounts?.reduce((acc, log) => {
      acc[log.userId] = (acc[log.userId] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const userRolesMap = userRoles?.reduce((acc, userRole) => {
      if (!acc[userRole.userId]) {
        acc[userRole.userId] = []
      }
      if (userRole.role && Array.isArray(userRole.role)) {
        userRole.role.forEach((role: { name: string }) => {
          acc[userRole.userId].push(role.name)
        })
      } else if (userRole.role && typeof userRole.role === 'object' && 'name' in userRole.role) {
        acc[userRole.userId].push((userRole.role as { name: string }).name)
      }
      return acc
    }, {} as Record<string, string[]>) || {}

    console.log('Debug - userRolesMap:', JSON.stringify(userRolesMap, null, 2))
    console.log('Debug - roleIdFilter:', roleIdFilter)

    // No need for additional role filtering since we filtered at query level
    let filteredProfiles = userProfiles || []

    // Apply email search filter if search term is provided
    if (search) {
      filteredProfiles = filteredProfiles.filter(profile => {
        const authUser = authUsersMap[profile.user_id]
        return profile.full_name?.toLowerCase().includes(search.toLowerCase()) ||
               authUser?.email?.toLowerCase().includes(search.toLowerCase())
      })
    }

    // Format the response
    const users = filteredProfiles.map(profile => ({
      userId: profile.user_id,
      displayName: profile.full_name || 'N/A',
      email: authUsersMap[profile.user_id]?.email || 'N/A',
      ieltsScore: profile.ielts_score || 'N/A',
      sessionParticipationCount: participationCountMap[profile.user_id] || 0,
      roles: userRolesMap[profile.user_id] || [],
      createdAt: profile.created_at
    }))

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
