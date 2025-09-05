import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Await params to get the id (Next.js App Router requirement)
    const { id } = await params

    if (!id) {
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
      .eq('id', id)
      .single()

    if (referenceError || !reference) {
      return NextResponse.json(
        { error: 'Reference not found' },
        { status: 404 }
      )
    }

    // Enrich with analysis data if available
    const { data: analysis } = await supabase
      .from('analyses')
      .select('*')
      .eq('reference_id', id)
      .single()

    const enrichedReference = {
      ...reference,
      analysis
    }

    return NextResponse.json({
      success: true,
      reference: enrichedReference
    })

  } catch (error) {
    console.error('Reference fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
