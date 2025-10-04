import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../lib/supabase'
import { isAdmin } from '../../lib/admin-utils'
import { authServer } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const currentUser = await authServer.getCurrentUser(token)

    if (!currentUser || !(await isAdmin(currentUser.id))) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }

    // Get all roles
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('roles')
      .select('id, name')
      .order('name')

    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, full_name')
      .limit(5)

    // Get all role assignments
    const { data: roleAssignments, error: assignmentsError } = await supabaseAdmin
      .from('roleToUser')
      .select(`
        userId,
        role:roles (
          id,
          name
        )
      `)
      .limit(10)

    return NextResponse.json({
      roles: roles || [],
      profiles: profiles || [],
      roleAssignments: roleAssignments || [],
      errors: {
        rolesError,
        profilesError,
        assignmentsError
      }
    })
  } catch (error) {
    console.error('Debug roles API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
