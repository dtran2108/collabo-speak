import type { 
  Session, 
  Persona, 
  UserSession,
  UserSessionInsert
} from '@/types/database'

const API_BASE_URL = '/api'

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  // In a real app, you'd get the token from your auth context or localStorage
  // For now, we'll assume the token is available globally or from a context
  const token = typeof window !== 'undefined' ? localStorage.getItem('supabase_token') : null
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'API request failed')
  }
  return response.json()
}

export const api = {
  // Auth endpoints
  auth: {
    async signIn(email: string, password: string) {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      return handleResponse(response)
    },

    async signOut() {
      const response = await fetch(`${API_BASE_URL}/auth/signout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    async getCurrentUser() {
      const response = await fetch(`${API_BASE_URL}/auth/user`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },
  },

  // Sessions endpoints
  sessions: {
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
  },

  // User sessions endpoints
  userSessions: {
    async getAll(): Promise<{ userSessions: UserSession[] }> {
      const response = await fetch(`${API_BASE_URL}/user-sessions`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    async create(userSession: UserSessionInsert): Promise<{ userSession: UserSession }> {
      const response = await fetch(`${API_BASE_URL}/user-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(userSession),
      })
      return handleResponse(response)
    },
  },

  // Transcript endpoints
  transcripts: {
    async upload(fileName: string, content: string): Promise<{ url: string; path: string }> {
      const response = await fetch(`${API_BASE_URL}/transcripts/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ fileName, content }),
      })
      return handleResponse(response)
    },
  },
}
