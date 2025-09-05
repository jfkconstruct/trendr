import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Fetch all offer profiles for the project
    const { data, error } = await supabase
      .from('offer_profiles')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch offer profiles' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profiles: data
    })

  } catch (error) {
    console.error('Offer profiles fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, name, problem, promise, proof, pitch, brandVoice, constraints } = await request.json()

    if (!projectId || !name || !problem || !promise || !proof || !pitch) {
      return NextResponse.json(
        { error: 'Project ID, name, problem, promise, proof, and pitch are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Create offer profile
    const { data, error } = await supabase
      .from('offer_profiles')
      .insert({
        project_id: projectId,
        name,
        problem,
        promise,
        proof,
        pitch,
        brand_voice: brandVoice,
        constraints: constraints || null
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create offer profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: data
    })

  } catch (error) {
    console.error('Offer profile creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, problem, promise, proof, pitch, brandVoice, constraints } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Update offer profile
    const { data, error } = await supabase
      .from('offer_profiles')
      .update({
        name,
        problem,
        promise,
        proof,
        pitch,
        brand_voice: brandVoice,
        constraints: constraints || null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update offer profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: data
    })

  } catch (error) {
    console.error('Offer profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Delete offer profile
    const { error } = await supabase
      .from('offer_profiles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete offer profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully'
    })

  } catch (error) {
    console.error('Offer profile deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
