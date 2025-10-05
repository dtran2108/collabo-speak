import type { Session, Persona } from '@/types/database'
import { getAuthHeaders, handleResponse, API_BASE_URL } from './shared'

export const sessionsApi = {
  async getAll(): Promise<{ sessions: Session[] }> {
    // Try to get auth headers, but don't fail if not available (for public access)
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      headers,
    })
    return handleResponse(response)
  },

  async getById(id: string): Promise<{ session: Session }> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/sessions/${id}`, {
      headers,
    })
    return handleResponse(response)
  },

  async getPersonas(sessionId: string): Promise<{ personas: Persona[] }> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/personas`, {
      headers,
    })
    return handleResponse(response)
  },
}
