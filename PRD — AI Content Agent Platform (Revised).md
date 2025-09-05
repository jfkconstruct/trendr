# PRD — AI Content Agent Platform (Revised)

## 1) Summary

Deliver a modern web application that (1) auto-discovers viral content across YouTube Shorts, Instagram, and TikTok from user-entered keywords, (2) provides deep analysis of why each piece performed well using AI-powered hook detection and content structure analysis, and (3) generates platform-specific content scripts and editor packs. Built with Next.js 14, TypeScript, and Supabase for rapid development and scalability.

## 2) Goals & Non-Goals

**Goals (MVP):**

- Enter a **niche keyword** → fetch top-performing content from YouTube Shorts, Instagram, and TikTok
- Provide **deep analysis** of viral content including hook types, content structure, and virality factors
- Rank results by **viral score** (engagement rate, growth velocity, content quality)
- Generate **platform-specific content** scripts based on analysis and user offers
- Display all results in a **custom UI** with cards, charts, and detailed analysis views
- Store all data in **Supabase** for persistence and future enhancements

**Non-Goals:**

- Complex taxonomy/creator databases
- Finished rendered videos or video editing
- Export functionality (in-app viewing only)
- 11Labs voice-over integration
- Multi-platform orchestration beyond basic discovery

## 3) Target Users

- **Solo creators** wanting repeatable content engines
- **Small agencies/editors** needing structured briefs
- **Marketers/founders** aiming for viral-style content tied to offers

## 4) Value Props

- **Type a niche → see hot content instantly** across multiple platforms
- **Deep AI analysis** showing exactly why content performed well
- **One-click generation** of platform-specific scripts based on successful patterns
- **Clean, modern interface** for easy content analysis and creation

## 5) User Stories

1. Enter "real estate" → see Top 10 YouTube Shorts, Instagram posts, and TikToks with metrics and analysis
2. Click "Analyze" → see detailed breakdown of hooks, structure, and virality factors
3. Click "Generate" → attach Offer → receive platform-specific script with captions and hashtags
4. View all results in a beautiful, interactive interface

## 6) App Flow

```
Onboard → Create Project
   ↓
Select Platform → Enter Niche keyword
   ↓
Discovery auto-fetches Top 10–20 by viral score
   ↓
Library: cards with metrics + analysis insights
   ↓
Pick Reference → Click "Analyze" → See detailed breakdown
   ↓
Click "Generate" → Attach Offer → Receive script pack
   ↓
View results in custom UI with charts and cards
```

## 7) Features

### 7.1 Discovery & Ranking

- **YouTube Shorts**: Data API `search.list` + `videos.list`
- **Instagram**: Hashtag Search API (limited quotas)
- **TikTok**: Manual URL input with metadata extraction
- **Viral Score**: Algorithm combining engagement rate, growth velocity, and content quality

### 7.2 Analysis Engine

- **Hook Detection**: Identify hook types (question, shock, story, stat, problem)
- **Content Structure**: Analyze pacing and segment breakdown
- **Virality Factors**: Extract key elements that drove performance
- **Cross-platform Patterns**: Platform-specific insights and trends

### 7.3 Content Generation

- **Platform-Specific Templates**: YouTube Shorts, Instagram Reels, TikTok
- **Offer Integration**: Generate scripts based on user offers (problem, promise, proof, pitch)
- **Output Validation**: Ensure generated content meets quality standards
- **Multiple Formats**: Scripts, captions, hashtags, beat sheets

### 7.4 UI Components

- **Card-based Layout**: Clean reference cards with key metrics
- **Analysis Dashboard**: Interactive charts and detailed breakdowns
- **Generation Interface**: Simple offer input and template selection
- **Responsive Design**: Works on desktop and mobile

## 8) Functional Requirements

- F1: Auto-discovery by keyword (YouTube/Instagram) or URL (TikTok)
- F2: Viral score ranking algorithm
- F3: AI-powered analysis with hook detection and structure analysis
- F4: Platform-specific content generation
- F5: Custom UI with cards, charts, and interactive elements

## 9) Non-Functional Requirements

- Latency ≤20s end-to-end for analysis and generation
- Uptime ≥99.5%
- Cost ≤$0.30 per analysis/generation
- Responsive design for all screen sizes

## 10) Data Model

### Tables

**references**
- id (UUID, Primary Key)
- platform (TEXT: 'youtube', 'instagram', 'tiktok')
- url (TEXT, NOT NULL)
- title (TEXT, NOT NULL)
- creator (TEXT, NOT NULL)
- metrics (JSONB: views, likes, comments, engagement_rate, duration)
- transcript (TEXT)
- viral_score (DECIMAL)
- thumbnail_url (TEXT)
- created_at (TIMESTAMPTZ)

**analyses**
- id (UUID, Primary Key)
- reference_id (UUID, Foreign Key)
- hooks (JSONB: array of hook objects)
- structure (JSONB: pacing, segments)
- content_metrics (JSONB: duration, text_density, hook_timing)
- why_worked (TEXT[]: array of insights)
- analysis_score (DECIMAL)
- created_at (TIMESTAMPTZ)

**generation_jobs**
- id (UUID, Primary Key)
- reference_id (UUID, Foreign Key)
- offer (JSONB: problem, promise, proof, pitch)
- outputs (JSONB: script, captions, hashtags, beats, broll, thumbnail_brief)
- status (TEXT: 'pending', 'processing', 'completed', 'failed')
- error_message (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

## 11) Architecture

### Technology Stack

**Frontend**
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- Material-UI for components
- Recharts for data visualization
- React Router for navigation

**Backend**
- Next.js API Routes (TypeScript)
- Supabase for database and authentication
- OpenRouter API for LLM integration

**Infrastructure**
- Vercel for frontend hosting
- Supabase for database and backend services
- GitHub for version control

### API Routes

```
/app/api/
├── discover/
│   ├── route.ts          # Main discovery endpoint
│   └── youtube/          # YouTube-specific routes
│       └── route.ts
├── analyze/
│   └── route.ts          # Analysis endpoint
├── generate/
│   └── route.ts          # Content generation
├── references/
│   └── route.ts          # CRUD operations
└── health/
    └── route.ts          # Health check
```

### Frontend Components

```
/components/
├── Discovery/
│   ├── PlatformSelector.tsx
│   ├── NicheInput.tsx
│   └── SearchButton.tsx
├── Analysis/
│   ├── HookAnalysis.tsx
│   ├── StructureAnalysis.tsx
│   └── ViralityScore.tsx
├── Generation/
│   ├── OfferInput.tsx
│   ├── TemplateSelector.tsx
│   └── GenerateButton.tsx
├── Library/
│   ├── ReferenceCard.tsx
│   ├── AnalysisResults.tsx
│   └── GenerationResults.tsx
└── UI/
    ├── Layout.tsx
    ├── LoadingSpinner.tsx
    └── ErrorDisplay.tsx
```

## 12) AI Components

### Analysis Engine

```typescript
interface AnalysisResult {
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
```

### Content Generation

```typescript
interface GenerationOutput {
  script: string;
  captions: string;
  hashtags: string[];
  beats: Array<{ t: number; beat: string }>;
  broll: Array<{ t: number; cue: string }>;
  thumbnailBrief: string;
  subtitles: string;
}
```

### LLM Integration

```typescript
// Unified LLM adapter for OpenRouter
interface LLMRequest {
  system: string;
  user: string;
  temperature?: number;
}

interface LLMResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

## 13) Implementation Phases

### Phase 0: Foundation (Week 1-2)
- Set up Next.js 14 project with TypeScript
- Configure Supabase database and schema
- Implement basic UI components and layout
- Add YouTube Data API integration

### Phase 1: Multi-Platform (Week 3-4)
- Add Instagram hashtag search
- Implement TikTok manual URL input
- Build analysis engine with hook detection
- Create cross-platform analysis patterns

### Phase 2: Generation & Polish (Week 5-6)
- Implement content generation system
- Add platform-specific templates
- Create Material-UI components and charts
- Testing and deployment

## 14) Environment Variables

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
YOUTUBE_API_KEY=your_youtube_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

## 15) Acceptance Criteria

- Enter niche → ≥10 references auto-fetched & ranked
- Reference cards show metrics + 2 "why it worked" bullets
- Analysis function outputs detailed breakdown ≤20s
- Generate function outputs platform-specific script ≤20s
- TikTok manual URL input works correctly
- UI is responsive and user-friendly

## 16) Success Metrics

- User can discover and analyze content in <30 seconds
- Analysis accuracy >85% (validated against manual review)
- User satisfaction >4.5/5
- System uptime >99.5%
- Cost per analysis <$0.30

---

# Developer Handoff Notes

## Project Setup

1. **Create Next.js 14 project**:
   ```bash
   npx create-next-app@latest ai-content-agent --typescript --tailwind --eslint --app
   cd ai-content-agent
   ```

2. **Install dependencies**:
   ```bash
   npm install @supabase/supabase-js @mui/material @emotion/react @emotion/styled recharts axios
   ```

3. **Set up Supabase**:
   - Create project at supabase.com
   - Set up database tables as defined above
   - Get project URL and service role key

4. **Configure environment variables**:
   - Create `.env.local` with all required variables
   - Add to `.gitignore`

## Key Implementation Notes

- **API Routes**: Use Next.js API routes with TypeScript
- **Database**: Use Supabase client for all database operations
- **LLM**: Use OpenRouter API with unified adapter
- **UI**: Use Material-UI components with Tailwind CSS
- **State Management**: Use React hooks and context API
- **Error Handling**: Implement comprehensive error handling
- **Loading States**: Show loading indicators for async operations

## Code Structure

- **Type Safety**: Use TypeScript interfaces for all data structures
- **Modular Components**: Create reusable components
- **API Layer**: Separate API calls from UI components
- **Database Layer**: Use Supabase services for data operations
- **LLM Layer**: Use adapter pattern for LLM integration

## Testing

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test API routes and database operations
- **E2E Tests**: Test user workflows with Playwright
- **Performance Tests**: Ensure fast response times

## Deployment

- **Frontend**: Deploy to Vercel
- **Database**: Use Supabase hosting
- **API Routes**: Deploy with Next.js on Vercel
- **Environment Variables**: Set up in production environment

---

This revised PRD provides a clear roadmap for building the AI Content Agent Platform from scratch with a modern, scalable architecture.
