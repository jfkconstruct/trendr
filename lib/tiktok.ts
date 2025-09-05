import axios from 'axios'

interface TikTokVideo {
  id: string
  url: string
  title: string
  creator: {
    id: string
    username: string
    nickname: string
    avatar: string
  }
  metrics: {
    views: number
    likes: number
    comments: number
    shares: number
    duration: number
  }
  thumbnail: string
  publishedAt: string
  music?: {
    id: string
    title: string
    author: string
  }
}

// TikTok API configuration
const TIKTOK_API_BASE = 'https://api16-normal-c-useast1a.tiktokv.com'

// Validate TikTok URL
export function isValidTikTokUrl(url: string): boolean {
  const tiktokUrlRegex = /^https?:\/\/(www\.)?tiktok\.com\/(@[a-zA-Z0-9_.-]+|video\/\d+)/
  return tiktokUrlRegex.test(url)
}

// Extract video ID from TikTok URL
export function extractTikTokVideoId(url: string): string | null {
  const match = url.match(/^https?:\/\/(www\.)?tiktok\.com\/(@[a-zA-Z0-9_.-]+|video\/(\d+))/)
  return match ? match[2] : null
}

// Get TikTok video metadata by URL
export async function getTikTokVideoByUrl(url: string): Promise<TikTokVideo | null> {
  try {
    const videoId = extractTikTokVideoId(url)
    if (!videoId) {
      throw new Error('Invalid TikTok URL')
    }

    // Use TikTok's public API (may have limitations)
    const response = await axios.get(`${TIKTOK_API_BASE}/video/detail/`, {
      params: {
        aweme_id: videoId,
        language: 'en'
      }
    })

    const videoData = response.data.aweme_detail
    if (!videoData) {
      throw new Error('Video not found')
    }

    return parseTikTokVideo(videoData)
  } catch (error) {
    console.error('TikTok video fetch error:', error)
    return null
  }
}

// Parse TikTok video data from API response
function parseTikTokVideo(videoData: any): TikTokVideo {
  const stats = videoData.stats || {}
  const author = videoData.author || {}
  const music = videoData.music || {}
  
  return {
    id: videoData.aweme_id,
    url: `https://www.tiktok.com/@${author.unique_id}/video/${videoData.aweme_id}`,
    title: videoData.desc || '',
    creator: {
      id: author.uid,
      username: author.unique_id,
      nickname: author.nickname,
      avatar: author.avatar_thumb?.url_list?.[0] || ''
    },
    metrics: {
      views: stats.play_count || 0,
      likes: stats.digg_count || 0,
      comments: stats.comment_count || 0,
      shares: stats.share_count || 0,
      duration: videoData.duration || 0
    },
    thumbnail: videoData.cover?.url_list?.[0] || '',
    publishedAt: videoData.create_time,
    music: music.id ? {
      id: music.id,
      title: music.title || '',
      author: music.author || ''
    } : undefined
  }
}

// Search TikTok videos by hashtag (limited functionality due to API restrictions)
export async function searchTikTokByHashtag(hashtag: string, limit: number = 20): Promise<TikTokVideo[]> {
  try {
    // Note: TikTok's public API has limited search capabilities
    // This is a simplified implementation that may not work in all cases
    const response = await axios.get(`${TIKTOK_API_BASE}/search/general/`, {
      params: {
        keyword: hashtag,
        count: limit,
        language: 'en'
      }
    })

    const videos: TikTokVideo[] = []
    
    if (response.data.data && response.data.data.length > 0) {
      for (const item of response.data.data) {
        if (item.aweme_id) {
          const video = await getTikTokVideoByUrl(`https://www.tiktok.com/@${item.author?.unique_id}/video/${item.aweme_id}`)
          if (video) {
            videos.push(video)
          }
        }
      }
    }

    return videos.slice(0, limit)
  } catch (error) {
    console.error('TikTok search error:', error)
    throw new Error(`Failed to search TikTok hashtag: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Calculate viral score for TikTok content
export function calculateTikTokViralScore(video: TikTokVideo): number {
  const engagementRate = video.metrics.likes + video.metrics.comments + video.metrics.shares
  const timeSincePost = Date.now() - (parseInt(video.publishedAt) * 1000) // Convert to milliseconds
  const hoursSincePost = timeSincePost / (1000 * 60 * 60)
  
  // Score based on engagement rate per hour
  const score = engagementRate / Math.max(hoursSincePost, 1)
  
  // Normalize to 0-100 scale
  return Math.min(100, Math.round(score * 100) / 100)
}

// Format TikTok video for our system
export function formatTikTokVideo(video: TikTokVideo): any {
  return {
    id: video.id,
    platform: 'tiktok',
    url: video.url,
    title: video.title.substring(0, 100) + (video.title.length > 100 ? '...' : ''),
    creator: video.creator.username,
    metrics: {
      views: video.metrics.views,
      likes: video.metrics.likes,
      comments: video.metrics.comments,
      engagementRate: calculateTikTokViralScore(video),
      duration: video.metrics.duration
    },
    thumbnail: video.thumbnail,
    publishedAt: video.publishedAt
  }
}

// Get trending TikTok videos (limited functionality)
export async function getTrendingTikTokVideos(limit: number = 20): Promise<TikTokVideo[]> {
  try {
    // Note: TikTok's public API doesn't provide a direct trending endpoint
    // This is a placeholder implementation
    const response = await axios.get(`${TIKTOK_API_BASE}/search/general/`, {
      params: {
        keyword: 'trending',
        count: limit,
        language: 'en'
      }
    })

    const videos: TikTokVideo[] = []
    
    if (response.data.data && response.data.data.length > 0) {
      for (const item of response.data.data) {
        if (item.aweme_id) {
          const video = await getTikTokVideoByUrl(`https://www.tiktok.com/@${item.author?.unique_id}/video/${item.aweme_id}`)
          if (video) {
            videos.push(video)
          }
        }
      }
    }

    return videos.slice(0, limit)
  } catch (error) {
    console.error('TikTok trending fetch error:', error)
    throw new Error(`Failed to fetch trending TikTok videos: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
