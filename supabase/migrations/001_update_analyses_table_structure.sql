-- Migration: Update analyses table structure to match PRD specification

-- Add new columns to analyses table
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS reasons JSONB NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS scores JSONB NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS why_worked TEXT[] DEFAULT '{}';

-- Remove old columns that are no longer needed (if they exist)
-- ALTER TABLE analyses DROP COLUMN IF EXISTS content_metrics;
-- ALTER TABLE analyses DROP COLUMN IF EXISTS analysis_score;

-- Update the view to include the new fields
DROP VIEW IF EXISTS reference_analyses;
CREATE VIEW reference_analyses AS
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

-- Add indexes for the new fields if needed
CREATE INDEX IF NOT EXISTS analyses_reasons_idx ON analyses USING GIN (reasons);
CREATE INDEX IF NOT EXISTS analyses_why_worked_idx ON analyses USING GIN (why_worked);

-- Update the trigger function to handle the new structure
-- (This is handled by the existing trigger functions, no changes needed)
