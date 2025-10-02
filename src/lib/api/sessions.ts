import type { Session, Persona } from '@/types/database'
import { handleResponse, API_BASE_URL } from './shared'

export const sessionsApi = {
  async getAll(): Promise<{ sessions: Session[] }> {
    const response = await fetch(`${API_BASE_URL}/sessions`)
    return handleResponse(response)
  },

  async getById(id: string): Promise<{ session: Session }> {
    const response = await fetch(`${API_BASE_URL}/sessions/${id}`)
    return handleResponse(response)
  },

  async getPersonas(sessionId: string): Promise<{ personas: Persona[] }> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/personas`)
    return handleResponse(response)
  },
}
