import { supabaseAdmin } from './supabase'

/**
 * Check if a user has admin privileges by querying their roles
 * @param userId - The user ID to check
 * @returns Promise<boolean> - True if user is admin, false otherwise
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('roleToUser')
      .select(`
        role:roles (
          name
        )
      `)
      .eq('userId', userId)

    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }

    console.log('Raw admin check data:', JSON.stringify(data, null, 2))
    
    return data?.some((item: { role: { name: string } | null } | { role: { name: string }[] } | { role: null }) => {
      console.log('Item role:', item.role, 'Type:', typeof item.role, 'Is array:', Array.isArray(item.role))
      if (Array.isArray(item.role)) {
        return item.role.some((role: { name: string }) => role.name === 'ADMIN')
      }
      return item.role?.name === 'ADMIN'
    }) || false
  } catch (error) {
    console.error('Error in isAdmin function:', error)
    return false
  }
}

/**
 * Check if a user has a specific role
 * @param userId - The user ID to check
 * @param roleName - The role name to check for
 * @returns Promise<boolean> - True if user has the role, false otherwise
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('roleToUser')
      .select(`
        role:roles (
          name
        )
      `)
      .eq('userId', userId)

    if (error) {
      console.error('Error checking user role:', error)
      return false
    }

    return data?.some((item: { role: { name: string } | null } | { role: { name: string }[] } | { role: null }) => {
      if (Array.isArray(item.role)) {
        return item.role.some((role: { name: string }) => role.name === roleName)
      }
      return item.role?.name === roleName
    }) || false
  } catch (error) {
    console.error('Error in hasRole function:', error)
    return false
  }
}
