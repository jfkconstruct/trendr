import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { analyzeContent } from '@/lib/llm'

export async function POST(request: NextRequest) {
  try {
    const { referenceId } = await request.json()

    if (!referenceId) {
      return NextResponse.json(
        { error: 'Reference ID is required' },
        { status: 400 }
      )
    }

    // Fetch reference from database
    const { data: reference, error: referenceError } = await supabaseServer
      .from('content_references')
      .select('*')
      .eq('id', referenceId)
      .single()

    if (referenceError || !reference) {
      return NextResponse.json(
        { error: 'Reference not found' },
        { status: 404 }
      )
    }

    // Check if analysis already exists
    const { data: existingAnalysis } = await supabaseServer
      .from('analyses')
      .select('*')
      .eq('reference_id', referenceId)
      .single()

    if (existingAnalysis) {
      return NextResponse.json({
        success: true,
        message: 'Analysis already exists',
        analysis: existingAnalysis
      })
    }

    // Prepare reference for analysis
    const referenceForAnalysis = {
      id: reference.id,
      platform: reference.platform,
      url: reference.url,
      title: reference.title,
      creator: reference.creator,
      metrics: reference.metrics,
      transcript: reference.transcript,
      viralScore: reference.viral_score,
      thumbnailUrl: reference.thumbnail_url
    }

    // Analyze content using LLM
    const analysis = await analyzeContent(referenceForAnalysis)

    // Save analysis to database
    const { data: savedAnalysis, error: analysisError } = await supabaseServer
      .from('analyses')
      .insert({
        reference_id: referenceId,
        hooks: analysis.hooks,
        structure: analysis.structure,
        content_metrics: analysis.contentMetrics,
        why_worked: analysis.whyWorked,
        analysis_score: analysis.analysisScore
      })
      .select()
      .single()

    if (analysisError) {
      console.error('Database error saving analysis:', analysisError)
      return NextResponse.json(
        { error: 'Failed to save analysis' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      analysis: savedAnalysis,
      message: 'Analysis completed successfully'
    })

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
