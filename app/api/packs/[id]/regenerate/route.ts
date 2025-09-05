import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin()
    
    // Fetch the original pack
    const { data: pack, error: fetchError } = await supabase
      .from('packs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !pack) {
      return NextResponse.json(
        { error: 'Pack not found' },
        { status: 404 }
      )
    }

    // Regenerate content using the existing generation endpoint
    const generationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        referenceId: pack.reference_id,
        offer: pack.offer_id ? { id: pack.offer_id } : null,
        platform: pack.platform,
        projectId: pack.project_id
      })
    })

    if (!generationResponse.ok) {
      throw new Error('Failed to regenerate content')
    }

    const { outputs } = await generationResponse.json()

    // Update the pack with new content
    const { data: updatedPack, error: updateError } = await supabase
      .from('packs')
      .update({
        contents: outputs,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      pack: updatedPack
    })

  } catch (error) {
    console.error('Error regenerating pack:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate pack' },
      { status: 500 }
    )
  }
}
