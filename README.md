# AI Content Agent Platform

A modern web application for discovering, analyzing, and generating viral content across YouTube Shorts, Instagram Reels, and TikTok.

## Features

- **Multi-Platform Discovery**: Find viral content from YouTube Shorts, Instagram Reels, and TikTok
- **AI-Powered Analysis**: Analyze content to understand why it performs well
- **Content Generation**: Generate new content based on successful patterns
- **Hook Detection**: Identify and analyze hooks that drive engagement
- **Content Structure Analysis**: Break down content into beats and segments
- **Viral Scoring**: Rank content by performance metrics
- **Platform-Specific Templates**: Generate content tailored to each platform

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **UI Framework**: Material-UI (MUI)
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **LLM Provider**: OpenRouter
- **YouTube API**: Google YouTube Data API v3

## Project Structure

```
ai-content-agent/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── discover/            # Content discovery endpoints
│   │   ├── analyze/             # Content analysis endpoints
│   │   ├── generate/            # Content generation endpoints
│   │   ├── references/          # Reference management
│   │   └── health/              # Health check endpoint
│   ├── discover/                # Discovery page
│   ├── library/                 # Content library page
│   ├── generate/                # Content generation page
│   ├── page.tsx                 # Home page
│   └── layout.tsx               # Root layout
├── components/                  # Reusable components
│   └── layout/                  # Layout components
│       └── Navigation.tsx       # Navigation component
├── lib/                         # Utility libraries
│   ├── supabase.ts             # Supabase client
│   ├── llm.ts                  # LLM adapter
│   ├── llm-client.ts           # LLM client utilities
│   └── prompts.ts              # AI prompts
├── supabase/                   # Database schema
│   └── schema.sql              # Database tables
├── .env.local                  # Environment variables
└── README.md                   # This file
```

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenRouter API key
- YouTube Data API v3 key

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd ai-content-agent

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# LLM Provider
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key

# Optional: Instagram API (for future use)
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_USER_ID=your_instagram_user_id
```

### 3. Database Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
3. Note your project URL and anon key for the environment variables

### 4. YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API key)
5. Add the API key to your `.env.local` file

### 5. OpenRouter Setup

1. Sign up at [openrouter.ai](https://openrouter.ai/)
2. Get your API key from the dashboard
3. Add the API key to your `.env.local` file

### 6. Run the Application

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production
npm start
```

## Usage

### 1. Discover Content

1. Navigate to the Discover page
2. Select a platform (YouTube Shorts, Instagram Reels, or TikTok)
3. Enter a niche keyword
4. Click "Discover" to find viral content

### 2. Analyze Content

1. Go to the Library page
2. Select a reference to view
3. Click the "View Analysis" button to see detailed analysis
4. Analysis includes:
   - Hook detection and timing
   - Content structure breakdown
   - Virality factors
   - Performance metrics

### 3. Generate Content

1. From the Library, click "Generate Content" on a reference
2. Configure your offer using the 4Ps framework:
   - Problem: What problem does your offer solve?
   - Promise: What benefit do you promise?
   - Proof: What evidence supports your claim?
   - Pitch: What's your call to action?
3. Click "Generate Content" to create new content
4. Review the generated content including:
   - Script
   - Captions
   - Hashtags
   - Content structure (beats)
   - B-roll suggestions
   - Thumbnail brief

## API Endpoints

### Discovery
- `POST /api/discover` - Discover content by platform and niche

### Analysis
- `POST /api/analyze` - Analyze a reference for hooks and structure

### Generation
- `POST /api/generate` - Generate content based on reference and offer

### References
- `GET /api/references` - Get all references
- `GET /api/references/:id` - Get specific reference
- `POST /api/references` - Create new reference
- `PUT /api/references/:id` - Update reference
- `DELETE /api/references/:id` - Delete reference

### Health
- `GET /api/health` - Health check endpoint

## Database Schema

### References Table
- `id` - UUID primary key
- `platform` - Platform type (youtube, instagram, tiktok)
- `url` - Content URL
- `title` - Content title
- `creator` - Creator name
- `metrics` - JSONB with performance metrics
- `transcript` - Video transcript
- `viral_score` - Calculated viral score
- `thumbnail_url` - Thumbnail URL
- `created_at` - Timestamp

### Analyses Table
- `id` - UUID primary key
- `reference_id` - Foreign key to references
- `hooks` - JSONB with hook data
- `structure` - JSONB with content structure
- `content_metrics` - JSONB with content metrics
- `why_worked` - Array of success factors
- `created_at` - Timestamp

### GenerationJobs Table
- `id` - UUID primary key
- `reference_id` - Foreign key to references
- `offer` - JSONB with offer configuration
- `outputs` - JSONB with generated content
- `status` - Job status (pending, processing, completed, failed)
- `created_at` - Timestamp

## Development

### Adding New Platforms

1. Update the platform enum in the database schema
2. Add platform-specific discovery logic in `/api/discover`
3. Update the analysis prompts for the new platform
4. Add platform UI components

### Customizing Prompts

Edit prompts in `lib/prompts.ts` to:
- Adjust analysis depth
- Change output format
- Add platform-specific guidelines
- Modify viral scoring criteria

### Styling

The application uses Material-UI components. Customize themes and styles in:
- `components/layout/Navigation.tsx`
- Individual page components
- Global CSS (if added)

## Deployment

### Vercel (Recommended)

1. Push your code to a Git repository
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Supabase Hosting

1. Build the application: `npm run build`
2. Deploy to Supabase hosting: `supabase hosting`
3. Set up environment variables in Supabase settings

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify Supabase credentials in `.env.local`
   - Check database connection in Supabase dashboard

2. **YouTube API Rate Limits**
   - Monitor API usage in Google Cloud Console
   - Implement caching for repeated queries

3. **LLM API Errors**
   - Verify OpenRouter API key
   - Check API usage limits and billing
   - Handle rate limiting in the application

4. **Build Errors**
   - Ensure all dependencies are installed
   - Check TypeScript types
   - Verify environment variables

### Performance Optimization

- Implement caching for frequently accessed data
- Use database indexes for common queries
- Optimize LLM prompts for faster responses
- Add pagination for large datasets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Note**: This is a MVP (Minimum Viable Product) focused on core functionality. Additional features and platform support will be added in future iterations.
