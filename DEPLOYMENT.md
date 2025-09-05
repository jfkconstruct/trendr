# Deployment Guide

This guide covers how to deploy the AI Content Agent Platform to various hosting providers.

## Prerequisites

Before deploying, ensure you have:

1. **Completed Development Setup**
   - All dependencies installed
   - Environment variables configured
   - Database schema created in Supabase

2. **Production Environment Variables**
   - Updated `.env.local` with production values
   - Supabase production credentials
   - OpenRouter API key
   - YouTube API key

3. **Git Repository**
   - Code pushed to a Git repository (GitHub, GitLab, etc.)

## Environment Variables for Production

Create a production environment file with these variables:

```env
# Database (Production)
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_service_role_key

# LLM Provider
OPENROUTER_API_KEY=your_production_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
NEXT_PUBLIC_APP_URL=https://your-domain.com

# YouTube API
YOUTUBE_API_KEY=your_production_youtube_api_key

# Optional: Instagram API (for future use)
INSTAGRAM_ACCESS_TOKEN=your_production_instagram_access_token
INSTAGRAM_USER_ID=your_production_instagram_user_id
```

## Deployment Options

### 1. Vercel (Recommended)

Vercel provides excellent integration with Next.js and automatic deployments.

#### Setup Steps:

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your Git repository
   - Configure the project settings

2. **Environment Variables**
   - Add all environment variables in the Vercel dashboard
   - Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL

3. **Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Deploy**
   - Click "Deploy" to start the deployment
   - Vercel will automatically detect the Next.js configuration

#### Vercel Configuration File (Optional)

Create `vercel.json` for custom configuration:

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_APP_URL": "https://your-domain.com"
  }
}
```

### 2. Supabase Hosting

Supabase provides hosting with edge functions and database integration.

#### Setup Steps:

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Deploy to Supabase**
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   supabase hosting
   ```

3. **Environment Variables**
   - Set environment variables in Supabase dashboard
   - Run: `supabase secrets set`

4. **Database Setup**
   - Ensure production database has the schema
   - Run migrations if needed

### 3. Docker Deployment

For containerized deployment:

#### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - YOUTUBE_API_KEY=${YOUTUBE_API_KEY}
    restart: unless-stopped
```

### 4. Traditional Server Deployment

For deployment on a Linux server:

#### Setup Steps:

1. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm nginx
   ```

2. **Clone Repository**
   ```bash
   git clone <repository-url> /var/www/ai-content-agent
   cd /var/www/ai-content-agent
   ```

3. **Install Node Dependencies**
   ```bash
   npm install
   ```

4. **Build Application**
   ```bash
   npm run build
   ```

5. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Start Application**
   ```bash
   npm start
   ```

## Database Setup in Production

### Supabase Production Database

1. **Create Production Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project for production

2. **Run Schema**
   - Execute the SQL from `supabase/schema.sql` in your production database

3. **Set Environment Variables**
   - Update `.env.local` with production database URL and keys
   - Set in your hosting platform's environment variables

4. **Database Migrations**
   - If you make schema changes, create migration files
   - Apply migrations to production database

## Environment Management

### Development vs Production

Use different environment files:

```bash
# Development
.env.local

# Production (created by hosting platform)
.env.production
```

### Secure Environment Variables

1. **Never commit secrets to Git**
2. **Use hosting platform's secret management**
3. **Consider using a secrets manager** for large applications

## Performance Optimization

### Production Build

```bash
# Build optimized for production
npm run build

# Start production server
npm start
```

### Caching Strategies

1. **Static Caching**
   - Next.js automatically caches static assets
   - Configure `next.config.js` for custom caching

2. **API Response Caching**
   - Implement Redis for API caching
   - Cache YouTube API responses

3. **Database Caching**
   - Use Supabase's built-in caching
   - Implement application-level caching

### Monitoring and Logging

1. **Error Tracking**
   - Set up Sentry or similar service
   - Track errors in production

2. **Performance Monitoring**
   - Use Vercel Analytics or similar
   - Monitor API response times

3. **Application Logs**
   - Configure logging for debugging
   - Monitor LLM API usage

## Security Considerations

### HTTPS Configuration

1. **Enable SSL/TLS**
   - Use Let's Encrypt for free certificates
   - Configure your hosting platform for HTTPS

2. **Security Headers**
   - Configure security headers in Nginx or hosting platform
   - Enable HSTS, CSP, etc.

### API Security

1. **Rate Limiting**
   - Implement rate limiting for API endpoints
   - Use Supabase Row Level Security

2. **Input Validation**
   - Validate all user inputs
   - Use TypeScript for type safety

### Database Security

1. **Row Level Security**
   - Configure RLS in Supabase
   - Ensure proper access controls

2. **Environment Variables**
   - Never expose database credentials
   - Use service role keys only when necessary

## Backup and Recovery

### Database Backups

1. **Supabase Backups**
   - Enable automated backups in Supabase dashboard
   - Download backups regularly

2. **Manual Backups**
   - Export database schema and data
   - Store backups in secure location

### Application Backups

1. **Code Backups**
   - Regular Git commits
   - Tag releases in Git

2. **Infrastructure Backups**
   - Backup server configurations
   - Document deployment process

## Troubleshooting Common Issues

### Build Failures

1. **Node.js Version**
   - Ensure using Node.js 18+
   - Check package.json engines field

2. **Missing Dependencies**
   - Run `npm install` before build
   - Check for peer dependencies

### Runtime Errors

1. **Environment Variables**
   - Verify all environment variables are set
   - Check for typos in variable names

2. **Database Connection**
   - Verify Supabase credentials
   - Check database connectivity

### Performance Issues

1. **Slow API Responses**
   - Check LLM API latency
   - Implement caching

2. **Memory Usage**
   - Monitor memory usage
   - Optimize LLM calls

## Maintenance

### Regular Updates

1. **Dependencies**
   - Regularly update npm packages
   - Check for security vulnerabilities

2. **Dependencies**
   - Update Node.js version when possible
   - Keep dependencies current

### Monitoring

1. **Health Checks**
   - Set up automated health checks
   - Monitor application uptime

2. **Usage Analytics**
   - Track API usage
   - Monitor user engagement

### Scaling

1. **Horizontal Scaling**
   - Use multiple instances
   - Load balance requests

2. **Vertical Scaling**
   - Increase server resources
   - Optimize database queries

---

This deployment guide should help you get your AI Content Agent Platform running in production. Choose the deployment method that best fits your needs and follow the corresponding setup steps.
