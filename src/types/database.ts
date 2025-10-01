export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string
          agentId: string
          isReady: boolean | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description: string
          agentId: string
          isReady?: boolean | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string
          agentId?: string
          isReady?: boolean | null
        }
      }
      personas: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          sessionId: string | null
          avatarUrl: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          sessionId?: string | null,
          avatarUrl: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          sessionId?: string | null,
          avatarUrl: string | null
        }
      }
      userSessions: {
        Row: {
          id: string
          created_at: string
          sessionId: string
          transcriptUrl: string | null
          userId: string
          reflection: string | null,
        }
        Insert: {
          id?: string
          created_at?: string
          sessionId: string
          transcriptUrl?: string | null
          userId: string
          reflection?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          sessionId?: string
          transcriptUrl?: string | null
          userId?: string
          reflection?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Session = Database['public']['Tables']['sessions']['Row']
export type Persona = Database['public']['Tables']['personas']['Row']
export type UserSession = Database['public']['Tables']['userSessions']['Row']

export type SessionInsert = Database['public']['Tables']['sessions']['Insert']
export type PersonaInsert = Database['public']['Tables']['personas']['Insert']
export type UserSessionInsert = Database['public']['Tables']['userSessions']['Insert']

export type SessionUpdate = Database['public']['Tables']['sessions']['Update']
export type PersonaUpdate = Database['public']['Tables']['personas']['Update']
export type UserSessionUpdate = Database['public']['Tables']['userSessions']['Update']
