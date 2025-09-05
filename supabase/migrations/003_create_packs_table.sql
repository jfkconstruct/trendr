-- Create packs table for storing generated content packs
CREATE TABLE IF NOT EXISTS public.packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_id UUID REFERENCES public.content_references(id) ON DELETE SET NULL,
  offer_id UUID REFERENCES public.offer_profiles(id) ON DELETE SET NULL,
  platform TEXT CHECK (platform IN ('shorts','reels','tiktok')) NOT NULL,
  contents JSONB NOT NULL, -- matches PackSchema from /lib/validator.ts
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster reference lookups
CREATE INDEX IF NOT EXISTS packs_reference_idx ON public.packs(reference_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_packs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on changes
CREATE TRIGGER packs_updated_at_trigger
BEFORE UPDATE ON public.packs
FOR EACH ROW
EXECUTE FUNCTION update_packs_updated_at();
