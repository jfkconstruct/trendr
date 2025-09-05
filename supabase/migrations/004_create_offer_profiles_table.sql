-- Create offer_profiles table for storing user offer/ICP profiles
CREATE TABLE IF NOT EXISTS public.offer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  problem TEXT NOT NULL,
  promise TEXT NOT NULL,
  proof TEXT NOT NULL,
  pitch TEXT NOT NULL,
  brand_voice TEXT,
  constraints JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_offer_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on changes
CREATE TRIGGER offer_profiles_updated_at_trigger
BEFORE UPDATE ON public.offer_profiles
FOR EACH ROW
EXECUTE FUNCTION update_offer_profiles_updated_at();
