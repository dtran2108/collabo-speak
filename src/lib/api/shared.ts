import { supabase } from '../supabase'

export const API_BASE_URL = '/api'

// Helper function to get auth headers
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
  } catch (error) {
    console.error('Error getting auth headers:', error)
    return {}
  }
}

// Helper function to handle API responses
export const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'API request failed')
  }
  return response.json()
}
