import { createClient } from '@supabase/supabase-js'

// Get Supabase configuration with fallbacks for development
const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// For development, we can allow the app to start even without Supabase
// but warn the user about missing configuration
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase configuration missing. Some features may not work properly.')
  // Don't throw an error in development to allow the app to start
  // This is a temporary workaround for development environments
}

// Create Supabase client for server-side operations
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Create Supabase client for client-side operations
export const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

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
