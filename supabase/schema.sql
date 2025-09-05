-- AI Content Agent Platform Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create content_references table (renamed from references to avoid SQL reserved keyword)
CREATE TABLE IF NOT EXISTS content_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok')),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  creator TEXT NOT NULL,
  metrics JSONB DEFAULT '{}',
  transcript TEXT,
  viral_score DECIMAL(10,2),
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for content_references table
CREATE INDEX IF NOT EXISTS content_references_platform_idx ON content_references(platform);
CREATE INDEX IF NOT EXISTS content_references_created_at_idx ON content_references(created_at);
CREATE INDEX IF NOT EXISTS content_references_viral_score_idx ON content_references(viral_score);

-- Create analyses table (matching PRD specification)
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_id UUID REFERENCES content_references(id) ON DELETE CASCADE,
  hooks JSONB NOT NULL DEFAULT '[]',
  structure JSONB NOT NULL DEFAULT '{}',
  reasons JSONB NOT NULL DEFAULT '{}',
  scores JSONB NOT NULL DEFAULT '{}',
  why_worked TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analyses table
CREATE INDEX IF NOT EXISTS analyses_reference_id_idx ON analyses(reference_id);
CREATE INDEX IF NOT EXISTS analyses_created_at_idx ON analyses(created_at);

-- Create generation_jobs table
CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_id UUID REFERENCES content_references(id) ON DELETE CASCADE,
  offer JSONB DEFAULT '{}',
  outputs JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for generation_jobs table
CREATE INDEX IF NOT EXISTS generation_jobs_reference_id_idx ON generation_jobs(reference_id);
CREATE INDEX IF NOT EXISTS generation_jobs_status_idx ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS generation_jobs_created_at_idx ON generation_jobs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_content_references_updated_at 
    BEFORE UPDATE ON content_references 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at 
    BEFORE UPDATE ON analyses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generation_jobs_updated_at 
    BEFORE UPDATE ON generation_jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW reference_analyses AS
SELECT 
    cr.id,
    cr.platform,
    cr.url,
    cr.title,
    cr.creator,
    cr.metrics,
    cr.viral_score,
    cr.created_at as reference_created_at,
    a.hooks,
    a.structure,
    a.reasons,
    a.why_worked,
    a.created_at as analysis_created_at
FROM content_references cr
LEFT JOIN analyses a ON cr.id = a.reference_id;

-- Create RLS (Row Level Security) policies
ALTER TABLE content_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for development (adjust for production)
CREATE POLICY "Enable all operations for development" ON content_references FOR ALL USING (true);
CREATE POLICY "Enable all operations for development" ON analyses FOR ALL USING (true);
CREATE POLICY "Enable all operations for development" ON generation_jobs FOR ALL USING (true);
