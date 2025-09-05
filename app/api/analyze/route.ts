import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { analyzeTranscript } from '@/lib/analyzer'

export async function POST(request: NextRequest) {
  try {
    const { referenceId } = await request.json()

    if (!referenceId) {
      return NextResponse.json(
        { error: 'Reference ID is required' },
        { status: 400 }
      )
    }

    // Create supabase instance
    const supabase = getSupabaseAdmin()
    
    // Fetch reference from database
    const { data: reference, error: referenceError } = await supabase
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
    const { data: existingAnalysis } = await supabase
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

    if (!reference.transcript || reference.transcript.length < 20) {
      return NextResponse.json(
        { error: 'Transcript missing' },
        { status: 400 }
      )
    }

    // Analyze content using the new analyzer library
    const analysis = await analyzeTranscript(reference, reference.transcript)

    // Save analysis to database (matching PRD schema)
    const { data: savedAnalysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        reference_id: referenceId,
        hooks: analysis.hooks,
        structure: analysis.structure,
        reasons: analysis.reasons,
        scores: analysis.scores,
        // Convert reasons.bullets to why_worked array as per PRD
        why_worked: analysis.reasons.bullets
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
