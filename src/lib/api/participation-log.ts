import type { SessionToUser, SessionToUserInsert } from '@/types/database'
import { getAuthHeaders, handleResponse, API_BASE_URL } from './shared'

export const participationLogApi = {
  async getAll(params?: {
    page?: number
    limit?: number
    sessionId?: string
    search?: string
  }): Promise<{ 
    sessionToUser: SessionToUser[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }> {
    const headers = await getAuthHeaders()
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.sessionId) searchParams.set('sessionId', params.sessionId)
    if (params?.search) searchParams.set('search', params.search)
    
    const url = `${API_BASE_URL}/session-to-user${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    
    const response = await fetch(url, {
      headers,
    })
    return handleResponse(response)
  },

  async create(userSession: SessionToUserInsert): Promise<{ userSession: SessionToUser }> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/session-to-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(userSession),
    })
    return handleResponse(response)
  },

  async update(id: string, feedback: JSON): Promise<{ userSession: SessionToUser }> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/user-sessions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(feedback),
    })
    return handleResponse(response)
  },
}
