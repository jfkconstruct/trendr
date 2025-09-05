import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await params to get the id (Next.js App Router requirement)
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('packs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Pack not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ pack: data })
  } catch (error) {
    console.error('Error fetching pack:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pack' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await params to get the id (Next.js App Router requirement)
    const { id } = await params
    const updateData = await request.json()
    
    if (!updateData || Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('packs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ pack: data })
  } catch (error) {
    console.error('Error updating pack:', error)
    return NextResponse.json(
      { error: 'Failed to update pack' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await params to get the id (Next.js App Router requirement)
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('packs')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pack:', error)
    return NextResponse.json(
      { error: 'Failed to delete pack' },
      { status: 500 }
    )
  }
}
