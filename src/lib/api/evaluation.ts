import { getAuthHeaders, handleResponse, API_BASE_URL } from './shared'

export const evaluationApi = {
  async evaluateTranscript(transcript: string) {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/evaluate-transcript`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ transcript }),
    })
    return handleResponse(response)
  },
}
