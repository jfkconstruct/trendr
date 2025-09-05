import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { generateContent } from '@/lib/llm'

export async function POST(request: NextRequest) {
  try {
    const { referenceId, offer, platform, projectId, offerId } = await request.json()

    if (!referenceId || !platform || !projectId) {
      return NextResponse.json(
        { error: 'Reference ID, platform, and project ID are required' },
        { status: 400 }
      )
    }

    // Validate platform
    const validPlatforms = ['youtube', 'instagram', 'tiktok']
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be one of: youtube, instagram, tiktok' },
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

    // Fetch analysis if available
    const { data: analysis } = await supabase
      .from('analyses')
      .select('*')
      .eq('reference_id', referenceId)
      .single()

    // Prepare reference for generation
    const referenceForGeneration = {
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

    // Fetch offer profile if offerId is provided
    let effectiveOffer = offer
    if (offerId) {
      const { data: offerProfile, error: offerError } = await supabase
        .from('offer_profiles')
        .select('*')
        .eq('id', offerId)
        .single()
      
      if (!offerError && offerProfile) {
        effectiveOffer = {
          problem: offerProfile.problem,
          promise: offerProfile.promise,
          proof: offerProfile.proof,
          pitch: offerProfile.pitch
        }
      }
    }

    // Create generation job
    const { data: generationJob, error: jobError } = await supabase
      .from('generation_jobs')
      .insert({
        reference_id: referenceId,
        offer: effectiveOffer,
        status: 'pending'
      })
      .select()
      .single()

    if (jobError) {
      console.error('Database error creating generation job:', jobError)
      return NextResponse.json(
        { error: 'Failed to create generation job' },
        { status: 500 }
      )
    }

    // Update job status to processing
    await supabase
      .from('generation_jobs')
      .update({ status: 'processing' })
      .eq('id', generationJob.id)

    try {
      // Generate content using LLM
      const generatedContent = await generateContent(
        platform as 'youtube' | 'instagram' | 'tiktok',
        referenceForGeneration,
        effectiveOffer
      )

      // Save to packs table
      const { data: pack, error: packError } = await supabase
        .from('packs')
        .insert({
          project_id: projectId,
          reference_id: referenceId,
          offer_id: offerId,
          platform,
          contents: generatedContent
        })
        .select()
        .single()

      if (packError) {
        throw packError
      }

      // Update generation job with results
      await supabase
        .from('generation_jobs')
        .update({
          outputs: generatedContent,
          status: 'completed',
          pack_id: pack.id
        })
        .eq('id', generationJob.id)

      return NextResponse.json({
        success: true,
        jobId: generationJob.id,
        packId: pack.id,
        outputs: generatedContent,
        message: 'Content generation completed successfully'
      })

    } catch (generationError) {
      console.error('Content generation error:', generationError)
      
      // Update job status to failed
      await supabase
        .from('generation_jobs')
        .update({
          status: 'failed',
          error_message: generationError instanceof Error ? generationError.message : 'Unknown error'
        })
        .eq('id', generationJob.id)

      return NextResponse.json(
        { 
          error: 'Content generation failed',
          details: generationError instanceof Error ? generationError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
