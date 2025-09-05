import { OpenAI } from 'openai'

// Configuration
const PROVIDER = process.env.LLM_PROVIDER || 'openrouter'
const MODEL = process.env.LLM_MODEL || 'anthropic/claude-3.5-sonnet'
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'

if (!OPENROUTER_API_KEY && !OPENAI_API_KEY) {
  throw new Error('Missing LLM API key. Please set either OPENROUTER_API_KEY or OPENAI_API_KEY')
}

// Create OpenAI client for OpenRouter
function createOpenRouterClient() {
  if (!OPENROUTER_API_KEY) {
    throw new Error('Missing OPENROUTER_API_KEY')
  }
  
  return new OpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey: OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'AI Content Agent'
    }
  })
}

// Create OpenAI client for OpenAI
function createOpenAIClient() {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY')
  }
  
  return new OpenAI({
    apiKey: OPENAI_API_KEY,
    baseURL: OPENAI_BASE_URL
  })
}

// Exponential backoff for retries
async function backoff<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let attempt = 0
  let lastErr: any

  while (attempt < tries) {
    try {
      return await fn()
    } catch (e: any) {
      lastErr = e
      const status = e?.status || e?.code
      
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (status && ![429, 500, 502, 503, 504].includes(Number(status))) {
        break
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 400 * Math.pow(2, attempt)))
      attempt++
    }
  }
  
  throw lastErr
}

// Extract JSON candidate from text (handles cases where model returns extra text)
export function extractJsonCandidate(text: string): string {
  const startIndex = text.indexOf('{')
  const endIndex = text.lastIndexOf('}')
  
  if (startIndex >= 0 && endIndex >= startIndex) {
    return text.slice(startIndex, endIndex + 1)
  }
  
  return text
}

// Main chat function that returns JSON
export async function chatJson(system: string, user: string, model?: string): Promise<string> {
  const client = PROVIDER === 'openrouter' ? createOpenRouterClient() : createOpenAIClient()
  const modelName = model || MODEL
  
  const response = await backoff(async () => {
    const completion = await client.chat.completions.create({
      model: modelName,
      temperature: 0.2, // Low temperature for deterministic outputs
      response_format: { type: 'json_object' }, // Force JSON response
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })

    const content = completion.choices[0]?.message?.content
    
    if (typeof content !== 'string') {
      throw new Error('LLM returned empty or invalid content')
    }

    return content
  })

  return response
}

// Export the appropriate OpenAI client
export function createOpenAI() {
  return PROVIDER === 'openrouter' ? createOpenRouterClient() : createOpenAIClient()
}

// Health check function
export async function checkLLMHealth(): Promise<boolean> {
  try {
    await chatJson('You are a helpful assistant.', 'Respond with {"status": "ok"}')
    return true
  } catch (error) {
    console.error('LLM health check failed:', error)
    return false
  }
}
