import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { calculateViralScore } from '@/lib/llm'
import { searchInstagramByHashtag, formatInstagramPost } from '@/lib/instagram'
import { getTikTokVideoByUrl, formatTikTokVideo } from '@/lib/tiktok'

// YouTube Data API setup
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

interface YouTubeVideo {
  id: string
  snippet: {
    title: string
    channelId: string
    channelTitle: string
    description: string
    publishedAt: string
    thumbnails: {
      default?: { url: string }
      medium?: { url: string }
      high?: { url: string }
      maxres?: { url: string }
    }
  }
  statistics: {
    viewCount: string
    likeCount?: string
    commentCount?: string
  }
  contentDetails: {
    duration: string
  }
}

interface YouTubeSearchResult {
  id: {
    kind: string
    videoId?: string
    channelId?: string
  }
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: any
    channelTitle: string
    liveBroadcastContent: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const { platform, niche } = await request.json()

    if (!platform || !niche) {
      return NextResponse.json(
        { error: 'Platform and niche are required' },
        { status: 400 }
      )
    }

    if (platform === 'youtube') {
      return await discoverYouTubeShorts(niche)
    } else if (platform === 'instagram') {
      return await discoverInstagram(niche)
    } else if (platform === 'tiktok') {
      return await discoverTikTok(niche)
    } else {
      return NextResponse.json(
        { error: 'Unsupported platform' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Discovery error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function discoverYouTubeShorts(niche: string) {
  try {
    // Search for YouTube Shorts
    const searchUrl = `${YOUTUBE_API_BASE}/search`
    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: niche,
      type: 'video',
      videoDuration: 'short',
      maxResults: '25',
      key: YOUTUBE_API_KEY,
      regionCode: 'US'
    })

    const searchResponse = await fetch(`${searchUrl}?${searchParams}`)
    const searchData = await searchResponse.json()

    if (!searchResponse.ok) {
      throw new Error(`YouTube API error: ${searchData.error?.message || 'Unknown error'}`)
    }

    const searchResults: YouTubeSearchResult[] = searchData.items || []

    // Get detailed video information
    const videoIds = searchResults
      .filter(item => item.id.videoId)
      .map(item => item.id.videoId!)
      .join(',')

    const videosUrl = `${YOUTUBE_API_BASE}/videos`
    const videosParams = new URLSearchParams({
      part: 'snippet,statistics,contentDetails',
      id: videoIds,
      key: YOUTUBE_API_KEY
    })

    const videosResponse = await fetch(`${videosUrl}?${videosParams}`)
    const videosData = await videosResponse.json()

    if (!videosResponse.ok) {
      throw new Error(`YouTube API error: ${videosData.error?.message || 'Unknown error'}`)
    }

    const videoDetails: YouTubeVideo[] = videosData.items || []

    // Process and enrich videos
    const processedVideos = await Promise.all(
      videoDetails.map(async (video) => {
        try {
          // Extract metrics
          const views = parseInt(video.statistics.viewCount) || 0
          const likes = parseInt(video.statistics.likeCount || '0') || 0
          const comments = parseInt(video.statistics.commentCount || '0') || 0
          
          // Calculate engagement rate
          const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0
          
          // Parse duration
          const duration = parseDuration(video.contentDetails.duration)
          
          // Calculate viral score
          const metrics = { views, likes, comments, engagementRate, duration }
          const viralScore = calculateViralScore({
            id: video.id,
            platform: 'youtube',
            url: `https://www.youtube.com/shorts/${video.id}`,
            title: video.snippet.title,
            creator: video.snippet.channelTitle,
            metrics,
            transcript: '', // Will be fetched later
            viralScore: 0, // Will be calculated
            thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url
          })

          return {
            id: video.id,
            platform: 'youtube' as const,
            url: `https://www.youtube.com/shorts/${video.id}`,
            title: video.snippet.title,
            creator: video.snippet.channelTitle,
            metrics,
            viralScore,
            thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
            publishedAt: video.snippet.publishedAt
          }
        } catch (error) {
          console.error('Error processing video:', error)
          return null
        }
      })
    )

    // Filter out null results and sort by viral score
    const validVideos = processedVideos.filter(Boolean) as any[]
    validVideos.sort((a, b) => b.viralScore - a.viralScore)

    // Return top 20 results
    const topVideos = validVideos.slice(0, 20)

    // Save to database
    const { error: upsertError } = await supabaseServer
      .from('content_references')
      .upsert(
        topVideos.map(video => ({
          id: video.id,
          platform: video.platform,
          url: video.url,
          title: video.title,
          creator: video.creator,
          metrics: video.metrics,
          viral_score: video.viralScore,
          thumbnail_url: video.thumbnailUrl
        })),
        { onConflict: 'url' }
      )

    if (upsertError) {
      console.error('Database error:', upsertError)
    }

    return NextResponse.json({
      success: true,
      items: topVideos,
      total: topVideos.length
    })

  } catch (error) {
    console.error('YouTube discovery error:', error)
    return NextResponse.json(
      { error: 'Failed to discover YouTube Shorts' },
      { status: 500 }
    )
  }
}

function parseDuration(duration: string): number {
  // Format: PT#M#S or PT#H#M#S
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')

  return hours * 3600 + minutes * 60 + seconds
}

async function discoverInstagram(niche: string) {
  try {
    // Search Instagram posts by hashtag
    const posts = await searchInstagramByHashtag(niche, 20)

    if (posts.length === 0) {
      return NextResponse.json({
        success: true,
        items: [],
        total: 0,
        message: 'No Instagram posts found for this hashtag'
      })
    }

    // Process and format posts
    const processedPosts = posts.map(post => {
      const formattedPost = formatInstagramPost(post)
      
      // Calculate viral score using our existing function
      const viralScore = calculateViralScore({
        id: post.id,
        platform: 'instagram',
        url: post.url,
        title: post.caption.substring(0, 100) + (post.caption.length > 100 ? '...' : ''),
        creator: post.owner.username,
        metrics: formattedPost.metrics,
        transcript: '', // Instagram doesn't provide transcripts
        viralScore: 0, // Will be calculated
        thumbnailUrl: post.display_url
      })

      return {
        ...formattedPost,
        viralScore,
        publishedAt: post.taken_at
      }
    })

    // Sort by viral score
    processedPosts.sort((a, b) => b.viralScore - a.viralScore)

    // Save to database
    const { error: upsertError } = await supabaseServer
      .from('content_references')
      .upsert(
        processedPosts.map(post => ({
          id: post.id,
          platform: post.platform,
          url: post.url,
          title: post.title,
          creator: post.creator,
          metrics: post.metrics,
          viral_score: post.viralScore,
          thumbnail_url: post.thumbnail
        })),
        { onConflict: 'url' }
      )

    if (upsertError) {
      console.error('Database error:', upsertError)
    }

    return NextResponse.json({
      success: true,
      items: processedPosts,
      total: processedPosts.length
    })

  } catch (error) {
    console.error('Instagram discovery error:', error)
    return NextResponse.json(
      { error: `Failed to discover Instagram content: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

async function discoverTikTok(niche: string) {
  try {
    // For TikTok, we'll treat the niche as a URL for manual input
    // If it's not a URL, we'll search for trending videos
    if (niche.startsWith('http')) {
      // Manual URL input
      const video = await getTikTokVideoByUrl(niche)
      
      if (!video) {
        return NextResponse.json({
          success: true,
          items: [],
          total: 0,
          message: 'TikTok video not found'
        })
      }

      const formattedVideo = formatTikTokVideo(video)
      
      // Calculate viral score using our existing function
      const viralScore = calculateViralScore({
        id: video.id,
        platform: 'tiktok',
        url: video.url,
        title: video.title,
        creator: video.creator.username,
        metrics: formattedVideo.metrics,
        transcript: '', // TikTok doesn't provide transcripts
        viralScore: 0, // Will be calculated
        thumbnailUrl: video.thumbnail
      })

      const processedVideo = {
        ...formattedVideo,
        viralScore,
        publishedAt: video.publishedAt
      }

      // Save to database
      const { error: upsertError } = await supabaseServer
        .from('content_references')
        .upsert({
          id: video.id,
          platform: 'tiktok',
          url: video.url,
          title: video.title,
          creator: video.creator.username,
          metrics: formattedVideo.metrics,
          viral_score: viralScore,
          thumbnail_url: video.thumbnail
        }, { onConflict: 'url' })

      if (upsertError) {
        console.error('Database error:', upsertError)
      }

      return NextResponse.json({
        success: true,
        items: [processedVideo],
        total: 1
      })
    } else {
      // Search by hashtag (limited functionality)
      const videos = await getTikTokVideoByUrl(`https://www.tiktok.com/tag/${niche}`)
      
      if (!videos) {
        return NextResponse.json({
          success: true,
          items: [],
          total: 0,
          message: 'No TikTok videos found for this hashtag'
        })
      }

      // Process and format videos
      const processedVideos = [videos].map(video => {
        const formattedVideo = formatTikTokVideo(video)
        
        // Calculate viral score using our existing function
        const viralScore = calculateViralScore({
          id: video.id,
          platform: 'tiktok',
          url: video.url,
          title: video.title,
          creator: video.creator.username,
          metrics: formattedVideo.metrics,
          transcript: '', // TikTok doesn't provide transcripts
          viralScore: 0, // Will be calculated
          thumbnailUrl: video.thumbnail
        })

        return {
          ...formattedVideo,
          viralScore,
          publishedAt: video.publishedAt
        }
      })

      // Sort by viral score
      processedVideos.sort((a, b) => b.viralScore - a.viralScore)

      // Save to database
      const { error: upsertError } = await supabaseServer
        .from('content_references')
        .upsert(
          processedVideos.map(video => ({
            id: video.id,
            platform: 'tiktok',
            url: video.url,
            title: video.title,
            creator: video.creator,
            metrics: video.metrics,
            viral_score: video.viralScore,
            thumbnail_url: video.thumbnail
          })),
          { onConflict: 'url' }
        )

      if (upsertError) {
        console.error('Database error:', upsertError)
      }

      return NextResponse.json({
        success: true,
        items: processedVideos,
        total: processedVideos.length
      })
    }
  } catch (error) {
    console.error('TikTok discovery error:', error)
    return NextResponse.json(
      { error: `Failed to discover TikTok content: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
