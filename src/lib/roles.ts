import { supabaseAdmin } from './supabase'

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
  }[] | null
}

/**
 * Get user roles from the database
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
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
    .filter((item: RawSupabaseUserRoleData) => item.role !== null && item.role !== undefined && item.role.length > 0) // Filter out items without role data
    .map((item: RawSupabaseUserRoleData) => ({
      id: item.id,
      userId: item.userId,
      roleId: item.roleId,
      role: {
        id: item.role![0].id,
        name: item.role![0].name,
        permissions: item.role![0].permissions
      }
    }))

  return transformedData
}

/**
 * Check if user has a specific role
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const userRoles = await getUserRoles(userId)
    return userRoles.some(userRole => userRole.role.name === roleName)
  } catch (error) {
    console.error('Error checking user role:', error)
    return false
  }
}

/**
 * Check if user has admin role
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    return await hasRole(userId, 'ADMIN')
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Get user permissions
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const userRoles = await getUserRoles(userId)
  const permissions = new Set<string>()
  
  userRoles.forEach(userRole => {
    userRole.role.permissions.forEach(permission => {
      permissions.add(permission)
    })
  })
  
  return Array.from(permissions)
}
