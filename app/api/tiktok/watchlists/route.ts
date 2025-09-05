import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { projectId, name, niche, items = [] } = await request.json()

    // Validate required fields
    if (!projectId || !name || !niche) {
      return NextResponse.json(
        { error: 'projectId, name, and niche are required' },
        { status: 400 }
      )
    }

    // Validate items structure
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'items must be an array' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Create watchlist
    const { data: watchlist, error: watchlistError } = await supabase
      .from('tiktok_watchlists')
      .insert({
        project_id: projectId,
        name,
        niche
      })
      .select()
      .single()

    if (watchlistError) {
      console.error('Watchlist creation error:', watchlistError)
      return NextResponse.json(
        { error: 'Failed to create watchlist' },
        { status: 500 }
      )
    }

    // Add items if provided
    if (items.length > 0) {
      const watchItems = items.map((item) => ({
        watchlist_id: watchlist.id,
        item_type: item.type,
        handle: item.handle,
        hashtag: item.hashtag,
        source: item.source || 'manual',
        enabled: true
      }))

      const { error: itemsError } = await supabase
        .from('tiktok_watch_items')
        .insert(watchItems)

      if (itemsError) {
        console.error('Watch items creation error:', itemsError)
        // Roll back watchlist creation if items fail
        await supabase
          .from('tiktok_watchlists')
          .delete()
          .eq('id', watchlist.id)

        return NextResponse.json(
          { error: 'Failed to add watch items' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      watchlistId: watchlist.id,
      message: 'Watchlist created successfully'
    })

  } catch (error) {
    console.error('Watchlist creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
