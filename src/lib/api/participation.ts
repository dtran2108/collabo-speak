import { getAuthHeaders, handleResponse, API_BASE_URL } from './shared'

export const participationApi = {
  async checkSessionParticipation(sessionIds: string[]): Promise<{ participation: { [sessionId: string]: boolean } }> {
    const headers = await getAuthHeaders()
    const searchParams = new URLSearchParams()
    searchParams.set('sessionIds', sessionIds.join(','))
    
    const response = await fetch(`${API_BASE_URL}/session-participation?${searchParams.toString()}`, {
      headers,
    })
    return handleResponse(response)
  },
}
