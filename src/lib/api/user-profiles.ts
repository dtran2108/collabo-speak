import type { UserProfile, UserProfileInsert, UserProfileUpdate } from '@/types/database'
import { getAuthHeaders, handleResponse, API_BASE_URL } from './shared'

export const userProfilesApi = {
  async get(): Promise<{ profile: UserProfile | null }> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/user-profiles`, {
      headers,
    })
    return handleResponse(response)
  },

  async create(profile: UserProfileInsert): Promise<{ profile: UserProfile }> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/user-profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(profile),
    })
    return handleResponse(response)
  },

  async update(profile: UserProfileUpdate): Promise<{ profile: UserProfile }> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/user-profiles`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(profile),
    })
    return handleResponse(response)
  },
}
