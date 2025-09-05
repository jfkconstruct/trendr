import axios from 'axios'

interface InstagramPost {
  id: string
  shortcode: string
  url: string
  display_url: string
  is_video: boolean
  caption: string
  owner: {
    id: string
    username: string
    full_name: string
    profile_pic_url: string
  }
  like_count: number
  comment_count: number
  taken_at: string
}

// Instagram Graph API configuration
const INSTAGRAM_GRAPH_API_BASE = 'https://graph.facebook.com/v18.0'

// Get Instagram access token (this should be stored securely)
function getInstagramAccessToken(): string {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  if (!token) {
    throw new Error('Instagram access token not configured')
  }
  return token
}

// Get Instagram user ID
function getInstagramUserId(): string {
  const userId = process.env.INSTAGRAM_USER_ID
  if (!userId) {
    throw new Error('Instagram user ID not configured')
  }
  return userId
}

// Search Instagram posts by hashtag using Graph API
export async function searchInstagramByHashtag(hashtag: string, limit: number = 20): Promise<InstagramPost[]> {
  try {
    const accessToken = getInstagramAccessToken()
    const userId = getInstagramUserId()
    
    // First, get hashtag ID
    const hashtagResponse = await axios.get(`${INSTAGRAM_GRAPH_API_BASE}/ig_hashtag_search`, {
      params: {
        user_id: userId,
        access_token: accessToken
      }
    })

    if (!hashtagResponse.data.data || hashtagResponse.data.data.length === 0) {
      throw new Error(`Hashtag #${hashtag} not found`)
    }

    const hashtagId = hashtagResponse.data.data[0].id

    // Get recent media for the hashtag
    const mediaResponse = await axios.get(`${INSTAGRAM_GRAPH_API_BASE}/${hashtagId}/recent_media`, {
      params: {
        user_id: userId,
        access_token: accessToken,
        fields: 'id,caption,media_type,media_url,permalink,like_count,comments_count,timestamp,owner{id,username,full_name,profile_pic_url}'
      }
    })

    const posts: InstagramPost[] = mediaResponse.data.data?.map((post: any) => ({
      id: post.id,
      shortcode: post.id.split('_')[0], // Extract shortcode from ID
      url: post.permalink,
      display_url: post.media_url,
      is_video: post.media_type === 'VIDEO',
      caption: post.caption || '',
      owner: post.owner || {
        id: userId,
        username: 'instagram',
        full_name: 'Instagram User',
        profile_pic_url: ''
      },
      like_count: post.like_count || 0,
      comment_count: post.comments_count || 0,
      taken_at: post.timestamp
    })) || []

    // Sort by engagement (likes + comments) and limit results
    return posts
      .sort((a, b) => (b.like_count + b.comment_count) - (a.like_count + a.comment_count))
      .slice(0, limit)

  } catch (error) {
    console.error('Instagram search error:', error)
    throw new Error(`Failed to search Instagram hashtag: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Get Instagram post by ID
export async function getInstagramPostById(postId: string): Promise<InstagramPost | null> {
  try {
    const accessToken = getInstagramAccessToken()
    const userId = getInstagramUserId()
    
    const response = await axios.get(`${INSTAGRAM_GRAPH_API_BASE}/${postId}`, {
      params: {
        user_id: userId,
        access_token: accessToken,
        fields: 'id,caption,media_type,media_url,permalink,like_count,comments_count,timestamp,owner{id,username,full_name,profile_pic_url}'
      }
    })

    const post = response.data
    return {
      id: post.id,
      shortcode: post.id.split('_')[0],
      url: post.permalink,
      display_url: post.media_url,
      is_video: post.media_type === 'VIDEO',
      caption: post.caption || '',
      owner: post.owner || {
        id: userId,
        username: 'instagram',
        full_name: 'Instagram User',
        profile_pic_url: ''
      },
      like_count: post.like_count || 0,
      comment_count: post.comments_count || 0,
      taken_at: post.timestamp
    }

  } catch (error) {
    console.error('Instagram post fetch error:', error)
    return null
  }
}

// Calculate viral score for Instagram content
export function calculateInstagramViralScore(post: InstagramPost): number {
  const engagementRate = post.like_count + post.comment_count
  const timeSincePost = Date.now() - new Date(post.taken_at).getTime()
  const hoursSincePost = timeSincePost / (1000 * 60 * 60)
  
  // Score based on engagement rate per hour
  const score = engagementRate / Math.max(hoursSincePost, 1)
  
  // Normalize to 0-100 scale
  return Math.min(100, Math.round(score * 100) / 100)
}

// Format Instagram post for our system
export function formatInstagramPost(post: InstagramPost): any {
  return {
    id: post.id,
    platform: 'instagram',
    url: post.url,
    title: post.caption.substring(0, 100) + (post.caption.length > 100 ? '...' : ''),
    creator: post.owner.username,
    metrics: {
      views: post.like_count * 10, // Estimate views from likes
      likes: post.like_count,
      comments: post.comment_count,
      engagementRate: calculateInstagramViralScore(post),
      duration: 0 // Instagram doesn't provide duration for images
    },
    thumbnail: post.display_url,
    publishedAt: post.taken_at
  }
}

// Validate Instagram URL
export function isValidInstagramUrl(url: string): boolean {
  const instagramUrlRegex = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/
  return instagramUrlRegex.test(url)
}

// Extract shortcode from Instagram URL
export function extractInstagramShortcode(url: string): string | null {
  const match = url.match(/^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/)
  return match ? match[3] : null
}
