import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getTikTokVideoByUrl, formatTikTokVideo } from '@/lib/tiktok'

export async function POST(request: NextRequest) {
  try {
    const { watchlistId } = await request.json()

    if (!watchlistId) {
      return NextResponse.json(
        { error: 'watchlistId is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Get enabled watch items
    const { data: watchItems } = await supabase
      .from('tiktok_watch_items')
      .select('*')
      .eq('watchlist_id', watchlistId)
      .eq('enabled', true)

    if (!watchItems || watchItems.length === 0) {
      return NextResponse.json(
        { error: 'No enabled watch items found' },
        { status: 400 }
      )
    }

    // Fetch videos for each watch item
    const discoveredVideos = await Promise.all(
      watchItems.map(async (item) => {
        try {
          let url = ''
          if (item.item_type === 'creator') {
            url = `https://www.tiktok.com/@${item.handle}`
          } else if (item.item_type === 'hashtag') {
            url = `https://www.tiktok.com/tag/${item.hashtag}`
          }

          if (!url) return null

          const video = await getTikTokVideoByUrl(url)
          if (!video) return null

          const formattedVideo = formatTikTokVideo(video)
          return {
            ...formattedVideo,
            source_item_id: item.id,
            watchlist_id: watchlistId
          }
        } catch (error) {
          console.error(`Error fetching video for item ${item.id}:`, error)
          return null
        }
      })
    )

    // Filter out null results
    const validVideos = discoveredVideos.filter(Boolean)

    if (validVideos.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new videos found',
        videos: []
      })
    }

    // Save discovered videos to content_references
    const { error: upsertError } = await supabase
      .from('content_references')
      .upsert(
        validVideos.map(video => ({
          platform: 'tiktok',
          url: video.url,
          title: video.title,
          creator: video.creator,
          metrics: video.metrics,
          viral_score: video.viralScore,
          thumbnail_url: video.thumbnail,
          source_item_id: video.source_item_id,
          watchlist_id: video.watchlist_id
        })),
        { onConflict: 'url' }
      )

    if (upsertError) {
      console.error('Database error saving videos:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save discovered videos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      videos: validVideos,
      message: 'Videos fetched successfully'
    })

  } catch (error) {
    console.error('Polling error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to poll TikTok content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
