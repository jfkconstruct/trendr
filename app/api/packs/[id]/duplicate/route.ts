import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin()
    
    // Fetch the original pack
    const { data: originalPack, error: fetchError } = await supabase
      .from('packs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !originalPack) {
      return NextResponse.json(
        { error: 'Pack not found' },
        { status: 404 }
      )
    }

    // Create a new pack with the same content
    const { data: newPack, error: createError } = await supabase
      .from('packs')
      .insert({
        project_id: originalPack.project_id,
        reference_id: originalPack.reference_id,
        offer_id: originalPack.offer_id,
        platform: originalPack.platform,
        contents: originalPack.contents
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    return NextResponse.json({
      success: true,
      pack: newPack
    })

  } catch (error) {
    console.error('Error duplicating pack:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate pack' },
      { status: 500 }
    )
  }
}
