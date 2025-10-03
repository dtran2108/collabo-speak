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
          sessionId?: string | null
          avatarUrl: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          sessionId?: string | null
          avatarUrl: string | null
        }
      }
      participation_log: {
        Row: {
          id: string
          created_at: string
          sessionId: string
          transcriptUrl: string | null
          userId: string
          reflection: string | null
          pisa_shared_understanding: number | null
          pisa_problem_solving_action: number | null
          pisa_team_organization: number | null
          words_per_min: number | null
          filler_words_per_min: number | null
          feedback: JSON | null
          participation_percentage: number | null
          duration: string | null
          user_question_or_feedback: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          sessionId: string
          transcriptUrl?: string | null
          userId: string
          reflection?: string | null
          pisa_shared_understanding?: number | null
          pisa_problem_solving_action?: number | null
          pisa_team_organization?: number | null
          words_per_min?: number | null
          filler_words_per_min?: number | null
          feedback?: JSON | null
          participation_percentage?: number | null
          duration?: string | null
          user_question_or_feedback?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          sessionId?: string
          transcriptUrl?: string | null
          userId?: string
          reflection?: string | null
          pisa_shared_understanding?: number | null
          pisa_problem_solving_action?: number | null
          pisa_team_organization?: number | null
          words_per_min?: number | null
          filler_words_per_min?: number | null
          feedback?: JSON | null
          participation_percentage?: number | null
          duration?: string | null
          user_question_or_feedback?: string | null
        }
      }
      user_profiles: {
        Row: {
          id: number
          created_at: string
          user_id: string
          full_name: string | null
          ielts_score: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          user_id: string
          full_name?: string | null
          ielts_score?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          user_id?: string
          full_name?: string | null
          ielts_score?: string | null
        }
      }
      roles: {
        Row: {
          id: string
          created_at: string
          name: string
          permissions: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          permissions: string[]
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          permissions?: string[]
        }
      }
      roleToUser: {
        Row: {
          id: string
          created_at: string
          userId: string
          roleId: string
        }
        Insert: {
          id?: string
          created_at?: string
          userId: string
          roleId: string
        }
        Update: {
          id?: string
          created_at?: string
          userId: string
          roleId: string
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
export type SessionToUser =
  Database['public']['Tables']['participation_log']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']

export type SessionInsert = Database['public']['Tables']['sessions']['Insert']
export type PersonaInsert = Database['public']['Tables']['personas']['Insert']
export type SessionToUserInsert =
  Database['public']['Tables']['participation_log']['Insert']
export type UserProfileInsert =
  Database['public']['Tables']['user_profiles']['Insert']

export type SessionUpdate = Database['public']['Tables']['sessions']['Update']
export type PersonaUpdate = Database['public']['Tables']['personas']['Update']
export type SessionToUserUpdate =
  Database['public']['Tables']['participation_log']['Update']
export type UserProfileUpdate =
  Database['public']['Tables']['user_profiles']['Update']
