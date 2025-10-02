import { getAuthHeaders, handleResponse, API_BASE_URL } from './shared'

export const transcriptsApi = {
  async upload(fileName: string, content: string): Promise<{ url: string; path: string }> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/transcripts/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ fileName, content }),
    })
    return handleResponse(response)
  },
}
