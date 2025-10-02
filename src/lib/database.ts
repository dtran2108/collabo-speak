import { supabase } from './supabase'
import type { 
  Session, 
  Persona, 
  SessionToUser,
  SessionInsert, 
  PersonaInsert, 
  SessionToUserInsert,
  SessionUpdate,
  PersonaUpdate,
  SessionToUserUpdate
} from '@/types/database'

// Storage bucket name for transcripts
const TRANSCRIPT_BUCKET = 'transcripts'

export const db = {
  // Sessions
  sessions: {
    // Get all sessions
    async getAll(): Promise<Session[]> {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error getting sessions:', error)
        return []
      }
      return data || []
    },

    // Get session by ID
    async getById(id: string): Promise<Session | null> {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error getting session:', error)
        return null
      }
      return data
    },

    // Create a new session
    async create(session: SessionInsert): Promise<Session | null> {
      const { data, error } = await supabase
        .from('sessions')
        .insert(session)
        .select()
        .single()
      
      if (error) {
        console.error('Error creating session:', error)
        return null
      }
      return data
    },

    // Update session
    async update(id: string, updates: SessionUpdate): Promise<Session | null> {
      const { data, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating session:', error)
        return null
      }
      return data
    },

    // Delete session
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting session:', error)
        return false
      }
      return true
    }
  },

  // Personas
  personas: {
    // Get personas for a session
    async getBySessionId(sessionId: string): Promise<Persona[]> {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('sessionId', sessionId)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error getting personas:', error)
        return []
      }
      return data || []
    },

    // Get all personas
    async getAll(): Promise<Persona[]> {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error getting personas:', error)
        return []
      }
      return data || []
    },

    // Create a new persona
    async create(persona: PersonaInsert): Promise<Persona | null> {
      const { data, error } = await supabase
        .from('personas')
        .insert(persona)
        .select()
        .single()
      
      if (error) {
        console.error('Error creating persona:', error)
        return null
      }
      return data
    },

    // Update persona
    async update(id: string, updates: PersonaUpdate): Promise<Persona | null> {
      const { data, error } = await supabase
        .from('personas')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating persona:', error)
        return null
      }
      return data
    },

    // Delete persona
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase
        .from('personas')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting persona:', error)
        return false
      }
      return true
    }
  },

  // User Sessions
  participationLog: {
    // Get user sessions for a user
    async getByUserId(userId: string): Promise<SessionToUser[]> {
      const { data, error } = await supabase
        .from('participation_log')
        .select(`
          *,
          sessions (
            id,
            name,
            description,
            agentId,
            isReady
          )
        `)
        .eq('userId', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error getting user sessions:', error)
        return []
      }
      return data || []
    },

    // Get user session by ID
    async getById(id: string): Promise<SessionToUser | null> {
      const { data, error } = await supabase
        .from('participation_log')
        .select(`
          *,
          sessions (
            id,
            name,
            description,
            agentId,
            isReady
          )
        `)
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error getting user session:', error)
        return null
      }
      return data
    },

    // Create a new user session
    async create(userSession: SessionToUserInsert): Promise<SessionToUser | null> {
      const { data, error } = await supabase
        .from('participation_log')
        .insert(userSession)
        .select(`
          *,
          sessions (
            id,
            name,
            description,
            agentId,
            isReady
          )
        `)
        .single()
      
      if (error) {
        console.error('Error creating user session:', error)
        return null
      }
      return data
    },

    // Update user session
    async update(id: string, updates: SessionToUserUpdate): Promise<SessionToUser | null> {
      const { data, error } = await supabase
        .from('participation_log')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          sessions (
            id,
            name,
            description,
            agentId,
            isReady
          )
        `)
        .single()
      
      if (error) {
        console.error('Error updating user session:', error)
        return null
      }
      return data
    },

    // Delete user session
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase
        .from('participation_log')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting user session:', error)
        return false
      }
      return true
    }
  },

  // Storage
  storage: {
    // Upload transcript file to Supabase storage
    async uploadTranscript(fileName: string, content: string): Promise<string | null> {
      try {
        // Create a Blob from the content
        const blob = new Blob([content], { type: 'text/plain' })
        
        // Upload to Supabase storage
        const { data, error } = await supabase.storage
          .from(TRANSCRIPT_BUCKET)
          .upload(fileName, blob, {
            contentType: 'text/plain',
            upsert: true // Overwrite if file exists
          })

        if (error) {
          console.error('Error uploading transcript:', error)
          return null
        }

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from(TRANSCRIPT_BUCKET)
          .getPublicUrl(data.path)

        return urlData.publicUrl
      } catch (error) {
        console.error('Error uploading transcript:', error)
        return null
      }
    },

    // Delete transcript file
    async deleteTranscript(fileName: string): Promise<boolean> {
      try {
        const { error } = await supabase.storage
          .from(TRANSCRIPT_BUCKET)
          .remove([fileName])

        if (error) {
          console.error('Error deleting transcript:', error)
          return false
        }

        return true
      } catch (error) {
        console.error('Error deleting transcript:', error)
        return false
      }
    }
  }
}
