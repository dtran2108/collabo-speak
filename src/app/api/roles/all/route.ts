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

    // Fetch all roles from the database
    const { data: roles, error } = await supabaseAdmin
      .from('roles')
      .select('id, name, permissions')
      .order('name')

    if (error) {
      console.error('Error fetching roles:', error)
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
    }

    return NextResponse.json({ roles: roles || [] })
  } catch (error) {
    console.error('Roles API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
