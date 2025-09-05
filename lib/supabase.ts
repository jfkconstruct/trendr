import { createClient } from '@supabase/supabase-js'

// Get Supabase configuration with proper validation
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create Supabase clients with fallbacks to prevent runtime errors
const supabaseServer = createClient(
  supabaseUrl || '', 
  supabaseServiceKey || '', 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const supabaseClient = createClient(supabaseUrl || '', supabaseServiceKey || '')

export { supabaseServer, supabaseClient }

// Database types
export interface Database {
  public: {
    Tables: {
      content_references: {
        Row: {
          id: string
          platform: 'youtube' | 'instagram' | 'tiktok'
          url: string
          title: string
          creator: string
          metrics: Record<string, any>
          transcript: string | null
          viral_score: number | null
          thumbnail_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          platform: 'youtube' | 'instagram' | 'tiktok'
          url: string
          title: string
          creator: string
          metrics?: Record<string, any>
          transcript?: string | null
          viral_score?: number | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          platform?: 'youtube' | 'instagram' | 'tiktok'
          url?: string
          title?: string
          creator?: string
          metrics?: Record<string, any>
          transcript?: string | null
          viral_score?: number | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      analyses: {
        Row: {
          id: string
          reference_id: string
          hooks: Record<string, any>[]
          structure: Record<string, any>
          content_metrics: Record<string, any>
          why_worked: string[]
          analysis_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reference_id: string
          hooks?: Record<string, any>[]
          structure?: Record<string, any>
          content_metrics?: Record<string, any>
          why_worked?: string[]
          analysis_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reference_id?: string
          hooks?: Record<string, any>[]
          structure?: Record<string, any>
          content_metrics?: Record<string, any>
          why_worked?: string[]
          analysis_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      generation_jobs: {
        Row: {
          id: string
          reference_id: string
          offer: Record<string, any>
          outputs: Record<string, any>
          status: 'pending' | 'processing' | 'completed' | 'failed'
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reference_id: string
          offer?: Record<string, any>
          outputs?: Record<string, any>
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reference_id?: string
          offer?: Record<string, any>
          outputs?: Record<string, any>
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
