import type { 
  Session, 
  Persona, 
  SessionToUser,
  SessionToUserInsert
} from '@/types/database'
import { supabase } from './supabase'

const API_BASE_URL = '/api'

// Helper function to get auth headers
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
  } catch (error) {
    console.error('Error getting auth headers:', error)
    return {}
  }
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
  sessionToUser: {
    async getAll(): Promise<{ sessionToUser: SessionToUser[] }> {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/session-to-user`, {
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
        body: JSON.stringify({ feedback }),
      })
      return handleResponse(response)
    },
  },

  // Transcript endpoints
  transcripts: {
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
  },

  // Evaluation endpoints
  evaluation: {
    async evaluateTranscript(transcript: string) {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/evaluate-transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ transcript }),
      })
      return handleResponse(response)
    },
  },
}
