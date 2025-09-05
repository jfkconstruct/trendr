# AI Content Agent Platform

This is a Next.js application for analyzing and generating content for social media platforms.

## Supabase Configuration

To properly configure Supabase for this application, you need to set up environment variables in your `.env.local` file:

```
# Server-only (used by server components and API routes)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Client-safe (used by client components)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Architecture

This application follows strict server/client boundaries to ensure security:

1. **Server Components** (like API routes) can use `SUPABASE_SERVICE_ROLE_KEY` for full admin access
2. **Client Components** (like pages) can only use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for read/write operations
3. **Never** expose service role keys to the browser

## File Structure

- `lib/supabase/server.ts` - Server-only admin client (uses service role key)
- `lib/supabase/client.ts` - Client-safe browser client (uses anon key)
- `lib/supabase.ts` - Server-only module for shared types and utilities

## Environment Variable Validation

The Supabase clients validate environment variables at import time:
- Server client validates `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Client client validates `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Testing Environment Variables

Run `npm run check-env` to verify your environment variables are properly configured.
