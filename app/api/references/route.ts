import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabaseServer
      .from('content_references')
      .select('*')
      .order('viral_score', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by platform if specified
    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch references' },
        { status: 500 }
      )
    }

    // Enrich with analysis data if available
    const enrichedReferences = await Promise.all(
      (data || []).map(async (reference) => {
        const { data: analysis } = await supabaseServer
          .from('analyses')
          .select('*')
          .eq('reference_id', reference.id)
          .single()

        return {
          ...reference,
          analysis
        }
      })
    )

    return NextResponse.json({
      success: true,
      references: enrichedReferences,
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('References fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const referenceData = await request.json()

    // Validate required fields
    const requiredFields = ['platform', 'url', 'title', 'creator', 'metrics']
    for (const field of requiredFields) {
      if (!referenceData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Validate platform
    const validPlatforms = ['youtube', 'instagram', 'tiktok']
    if (!validPlatforms.includes(referenceData.platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be one of: youtube, instagram, tiktok' },
        { status: 400 }
      )
    }

    // Insert reference
    const { data, error } = await supabaseServer
      .from('content_references')
      .insert(referenceData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create reference' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reference: data,
      message: 'Reference created successfully'
    })

  } catch (error) {
    console.error('Reference creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
