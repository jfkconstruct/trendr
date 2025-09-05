import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { checkLLMHealth } from '@/lib/llm-client'

export async function GET() {
  try {
    // Create supabase instance
    const supabase = getSupabaseAdmin()
    
    // Check database connection
    const { data, error } = await supabase.from('content_references').select('count', { count: 'exact', head: true })
    
    if (error) {
      return NextResponse.json(
        { 
          status: 'unhealthy',
          database: 'error',
          llm: 'unchecked',
          message: 'Database connection failed'
        },
        { status: 503 }
      )
    }

    // Check LLM connection
    const llmHealthy = await checkLLMHealth()

    // Check environment variables
    const envChecks = {
      supabaseUrl: !!process.env.SUPABASE_URL,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      youtubeApiKey: !!process.env.YOUTUBE_API_KEY,
      openRouterApiKey: !!process.env.OPENROUTER_API_KEY
    }

    const allEnvOk = Object.values(envChecks).every(check => check)

    // Determine overall health
    const isHealthy = !error && llmHealthy && allEnvOk

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      database: error ? 'error' : 'healthy',
      llm: llmHealthy ? 'healthy' : 'error',
      environment: allEnvOk ? 'healthy' : 'error',
      checks: {
        database: error ? (error as any).message || 'error' : 'connected',
        llm: llmHealthy ? 'responsive' : 'unresponsive',
        environment: envChecks
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}
