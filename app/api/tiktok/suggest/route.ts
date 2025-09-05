import { NextRequest, NextResponse } from 'next/server'
import { chatJson } from '@/lib/llm-client'

export async function POST(request: NextRequest) {
  try {
    const { niche } = await request.json()

    if (!niche) {
      return NextResponse.json(
        { error: 'niche is required' },
        { status: 400 }
      )
    }

    // Use LLM to suggest creators and hashtags
    const systemPrompt = `You suggest TikTok creators and hashtags for a given niche. Return STRICT JSON with {creators: string[], hashtags: string[]}.`
    const userPrompt = `Niche: ${niche}\n\nSuggest 5-10 relevant TikTok creators and 5-10 relevant hashtags.`

    const response = await chatJson(systemPrompt, userPrompt)
    const suggestions = JSON.parse(response)

    // Validate response structure
    if (!Array.isArray(suggestions.creators) || !Array.isArray(suggestions.hashtags)) {
      throw new Error('Invalid suggestion response structure')
    }

    // Clean hashtags (remove # if present and make lowercase)
    const cleanedHashtags = suggestions.hashtags.map((tag: string) => 
      tag.startsWith('#') ? tag.slice(1).toLowerCase() : tag.toLowerCase()
    )

    return NextResponse.json({
      success: true,
      niche,
      creators: suggestions.creators,
      hashtags: cleanedHashtags,
      message: 'Suggestions generated successfully'
    })

  } catch (error) {
    console.error('Suggestion error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
