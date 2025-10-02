import { getAuthHeaders, handleResponse, API_BASE_URL } from './shared'

export const authApi = {
  async signIn(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return handleResponse(response)
  },

  async signOut() {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/auth/signout`, {
      method: 'POST',
      headers,
    })
    return handleResponse(response)
  },

  async getCurrentUser() {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/auth/user`, {
      method: 'GET',
      headers,
    })
    return handleResponse(response)
  },
}
