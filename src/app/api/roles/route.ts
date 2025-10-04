import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../lib/supabase'
import { authServer } from '@/lib/auth-server'

export type Role = {
  id: string
  name: string
  permissions: string[]
}

export type UserRole = {
  id: string
  userId: string
  roleId: string
  role: Role
}

type RawSupabaseUserRoleData = {
  id: string
  userId: string
  roleId: string
  role: {
    id: string
    name: string
    permissions: string[]
  } | null
}

// Helper function to get user roles from the database
async function getUserRoles(userId: string): Promise<UserRole[]> {
  const { data, error } = await supabaseAdmin
    .from('roleToUser')
    .select(`
      id,
      userId,
      roleId,
      role:roles (
        id,
        name,
        permissions
      )
    `)
    .eq('userId', userId)

  if (error) {
    console.error('Error fetching user roles:', error)
    return []
  }

  // Transform the data to match the expected type
  const transformedData = (data || [])
    .filter((item: RawSupabaseUserRoleData) => item.role !== null && item.role !== undefined)
    .map((item: RawSupabaseUserRoleData) => ({
      id: item.id,
      userId: item.userId,
      roleId: item.roleId,
      role: {
        id: item.role.id,
        name: item.role.name,
        permissions: item.role.permissions
      }
    }))

  return transformedData
}

// Helper function to check if user has a specific role
async function hasRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const userRoles = await getUserRoles(userId)
    return userRoles.some(userRole => userRole.role.name === roleName)
  } catch (error) {
    console.error('Error checking user role:', error)
    return false
  }
}

// Helper function to get user permissions
async function getUserPermissions(userId: string): Promise<string[]> {
  const userRoles = await getUserRoles(userId)
  const permissions = new Set<string>()
  
  userRoles.forEach(userRole => {
    userRole.role.permissions.forEach(permission => {
      permissions.add(permission)
    })
  })
  
  return Array.from(permissions)
}

// GET /api/roles - Get user roles and permissions
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
    const user = await authServer.getCurrentUser(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'roles':
        const userRoles = await getUserRoles(user.id)
        return NextResponse.json({ roles: userRoles })

      case 'permissions':
        const permissions = await getUserPermissions(user.id)
        return NextResponse.json({ permissions })

      case 'hasRole': {
        const roleName = searchParams.get('roleName')
        if (!roleName) {
          return NextResponse.json(
            { error: 'roleName parameter required' },
            { status: 400 }
          )
        }
        const hasRoleResult = await hasRole(user.id, roleName)
        return NextResponse.json({ hasRole: hasRoleResult, roleName })
      }

      case 'isAdmin': {
        const isAdminResult = await hasRole(user.id, 'ADMIN')
        return NextResponse.json({ isAdmin: isAdminResult })
      }

      default: {
        // Return all user info by default
        const allRoles = await getUserRoles(user.id)
        const allPermissions = await getUserPermissions(user.id)
        const isAdminResult = await hasRole(user.id, 'ADMIN')
        
        return NextResponse.json({
          userId: user.id,
          roles: allRoles,
          permissions: allPermissions,
          isAdmin: isAdminResult
        })
      }
    }
  } catch (error) {
    console.error('Roles API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/roles - Check roles for a specific user (admin only)
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
    const user = await authServer.getCurrentUser(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if requesting user is admin
    const isAdminResult = await hasRole(user.id, 'ADMIN')
    if (!isAdminResult) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { targetUserId, action } = await request.json()

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'targetUserId required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'roles':
        const userRoles = await getUserRoles(targetUserId)
        return NextResponse.json({ roles: userRoles, targetUserId })

      case 'permissions':
        const permissions = await getUserPermissions(targetUserId)
        return NextResponse.json({ permissions, targetUserId })

      case 'hasRole': {
        const { roleName } = await request.json()
        if (!roleName) {
          return NextResponse.json(
            { error: 'roleName required' },
            { status: 400 }
          )
        }
        const hasRoleResult = await hasRole(targetUserId, roleName)
        return NextResponse.json({ hasRole: hasRoleResult, roleName, targetUserId })
      }

      case 'isAdmin': {
        const isAdminResult = await hasRole(targetUserId, 'ADMIN')
        return NextResponse.json({ isAdmin: isAdminResult, targetUserId })
      }

      default: {
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
      }
    }
  } catch (error) {
    console.error('Roles API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
