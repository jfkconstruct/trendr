import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('packs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ packs: data || [] })
  } catch (error) {
    console.error('Error fetching packs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch packs' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { project_id, reference_id, offer_id, platform, contents } = await request.json()

    if (!project_id || !platform || !contents) {
      return NextResponse.json(
        { error: 'project_id, platform, and contents are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('packs')
      .insert({
        project_id,
        reference_id,
        offer_id,
        platform,
        contents
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ pack: data })
  } catch (error) {
    console.error('Error creating pack:', error)
    return NextResponse.json(
      { error: 'Failed to create pack' },
      { status: 500 }
    )
  }
}
