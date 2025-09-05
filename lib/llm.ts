import { chatJson, extractJsonCandidate } from './llm-client'

// LLM Configuration
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openrouter'
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini'
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!

if (!OPENROUTER_API_KEY) {
  throw new Error('Missing OPENROUTER_API_KEY environment variable')
}

// Analysis interface
export interface AnalysisResult {
  hooks: Array<{
    type: 'question' | 'shock' | 'story' | 'stat' | 'problem';
    timestamp: number;
    text: string;
  }>;
  structure: {
    pacing: 'fast' | 'medium' | 'slow';
    segments: Array<{
      type: 'hook' | 'setup' | 'proof' | 'payoff' | 'cta';
      start: number;
      end: number;
    }>;
  };
  contentMetrics: {
    duration: number;
    textDensity: number;
    hookTiming: number;
  };
  whyWorked: string[];
  analysisScore: number;
}

// Enhanced Generation interface
export interface GenerationOutput {
  script: string;
  scriptVariants: string[]; // Multiple hook variants
  captions: string;
  hashtags: string[];
  beats: Array<{ t: number; beat: string }>;
  beatSheet: Array<{ 
    t: number; 
    beat: string; 
    type: 'hook' | 'setup' | 'proof' | 'payoff' | 'cta' | 'transition' 
  }>;
  broll: Array<{ 
    t: number; 
    cue: string; 
    shotType?: string; 
    keywords?: string[] 
  }>;
  thumbnailBrief: string;
  subtitles: string;
  voScript?: string; // Voice-over script for 11Labs
}

// Offer interface
export interface Offer {
  problem: string;
  promise: string;
  proof: string;
  pitch: string;
}

// Reference interface
export interface Reference {
  id: string;
  platform: 'youtube' | 'instagram' | 'tiktok';
  url: string;
  title: string;
  creator: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    engagementRate: number;
    duration: number;
  };
  transcript?: string;
  viralScore: number;
  thumbnailUrl?: string;
}

// Analysis prompt
export function createAnalysisPrompt(reference: Reference): string {
  return `
ANALYZE VIRAL CONTENT - ${reference.platform.toUpperCase()}
Title: ${reference.title}
Creator: ${reference.creator}
Views: ${reference.metrics.views}
Engagement Rate: ${reference.metrics.engagementRate}%
Duration: ${reference.metrics.duration}s
Transcript: ${reference.transcript || 'No transcript available'}

TASK: Identify why this content performed well using cross-platform patterns.

Focus on:
1. Hook effectiveness (first 3 seconds)
2. Content structure and pacing
3. Emotional triggers
4. Platform-specific optimization
5. Content length effectiveness

Return JSON with:
- hooks: array of {type, timestamp, text}
- structure: {pacing, segments}
- content_metrics: {duration, text_density, hook_timing}
- why_worked: array of 3-5 bullet points
- analysis_score: decimal 0-100

Constraints:
- Hook types: question, shock, story, stat, problem
- Pacing: fast, medium, slow
- Segment types: hook, setup, proof, payoff, cta
- Timestamps in seconds
- Analysis score should reflect overall quality and virality potential
`;
}

// Enhanced Generation prompt
export function createGenerationPrompt(
  platform: 'youtube' | 'instagram' | 'tiktok',
  reference: Reference,
  offer: Offer
): string {
  const platformHints = {
    youtube: `Format for YouTube Shorts (≤60s). 1:1 or 9:16 framing. Hook in ≤3s.
Keep spoken lines short. Include on-screen text cues in [TEXT] brackets.`,
    instagram: `Format for Instagram Reels (≤60s). Emphasize visual transitions;
front-load novelty. Keep copy friendly and hashtag list compact (≤8).`,
    tiktok: `Format for TikTok (≤60s). Pattern interrupt in first 2s.
Use rhythmic phrasing; avoid platform-ban phrases. Use 3-6 focused hashtags.`
  };

  return `
CREATE ${platform.toUpperCase()} CONTENT PACK
Platform: ${platform}
Reference: ${reference.title}
Why it worked: ${reference.transcript?.substring(0, 200) || 'Strong hook and engaging content'}
Offer: Problem: ${offer.problem}, Promise: ${offer.promise}, Proof: ${offer.proof}, Pitch: ${offer.pitch}

GUIDELINES:
${platformHints[platform]}

TASK: Generate comprehensive platform-native content pack based on successful patterns and offer integration.

Return JSON with:
- script: complete primary script with [TEXT: cues]
- script_variants: array of 3-5 alternative hook variants
- captions: 1-2 sentences ending with CTA
- hashtags: array of 4-8 niche-specific tags
- beats: array of {t, beat} for timeline
- beat_sheet: detailed beat sheet with types (hook, setup, proof, payoff, cta, transition)
- broll: array of {t, cue, shot_type?, keywords?} for visual elements
- thumbnail_brief: concrete visual guidance with composition details
- subtitles: valid SRT format
- vo_script: voice-over script for 11Labs (if applicable)

Constraints:
- Script: Hook → Setup → Proof → Payoff → CTA
- Keep it engaging and platform-optimized
- Include specific CTAs and value propositions
- Generate multiple hook variants for flexibility
- Include detailed beat sheet with timing and types
- Provide shot type and keyword information for b-roll
- Create thumbnail brief with concrete visual guidance
- Generate subtitles in proper SRT format
`;
}

// Analyze content using LLM
export async function analyzeContent(reference: Reference): Promise<AnalysisResult> {
  const prompt = createAnalysisPrompt(reference)
  
  try {
    const response = await chatJson(
      'You are a senior content strategist and analyst. You MUST output strictly valid JSON.',
      prompt
    )
    
    // Parse and validate the response
    const parsed = JSON.parse(response)
    
    // Validate required fields
    if (!parsed.hooks || !parsed.structure || !parsed.contentMetrics || !parsed.whyWorked) {
      throw new Error('Invalid analysis response structure')
    }
    
    return {
      hooks: parsed.hooks,
      structure: parsed.structure,
      contentMetrics: parsed.contentMetrics,
      whyWorked: parsed.whyWorked,
      analysisScore: parsed.analysisScore || 0
    }
  } catch (error) {
    console.error('Analysis failed:', error)
    throw new Error(`Content analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Generate content using LLM
export async function generateContent(
  platform: 'youtube' | 'instagram' | 'tiktok',
  reference: Reference,
  offer: Offer
): Promise<GenerationOutput> {
  const prompt = createGenerationPrompt(platform, reference, offer)
  
  try {
    const response = await chatJson(
      'You are a professional scriptwriter and content creator. You MUST output strictly valid JSON.',
      prompt
    )
    
    // Parse and validate the response
    const parsed = JSON.parse(response)
    
    // Validate all required fields including new ones
    const requiredFields = ['script', 'script_variants', 'captions', 'hashtags', 'beats', 'beat_sheet', 'broll', 'thumbnail_brief', 'subtitles']
    for (const field of requiredFields) {
      if (!parsed[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    return {
      script: parsed.script,
      scriptVariants: parsed.script_variants || [],
      captions: parsed.captions,
      hashtags: parsed.hashtags,
      beats: parsed.beats,
      beatSheet: parsed.beat_sheet || [],
      broll: parsed.broll,
      thumbnailBrief: parsed.thumbnail_brief,
      subtitles: parsed.subtitles,
      voScript: parsed.vo_script
    }
  } catch (error) {
    console.error('Generation failed:', error)
    throw new Error(`Content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Calculate viral score
export function calculateViralScore(reference: Reference): number {
  const { views, engagementRate, duration } = reference.metrics
  
  // Base score from views (logarithmic to handle viral content)
  const viewScore = Math.log10(views + 1) * 10
  
  // Engagement rate multiplier
  const engagementMultiplier = engagementRate / 100 * 20
  
  // Duration penalty/bonus (optimal is 30-60 seconds)
  const durationScore = duration >= 30 && duration <= 60 ? 10 : Math.max(0, 10 - Math.abs(45 - duration) * 0.2)
  
  // Final score (0-100)
  const totalScore = Math.min(100, viewScore + engagementMultiplier + durationScore)
  
  return Math.round(totalScore * 100) / 100
}
