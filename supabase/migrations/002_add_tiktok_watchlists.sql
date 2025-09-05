-- Add TikTok watchlist tables as per Simplified MVP PRD
CREATE TABLE tiktok_watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  niche TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tiktok_watch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID NOT NULL REFERENCES tiktok_watchlists(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('creator', 'hashtag')),
  handle TEXT,
  hashtag TEXT,
  source TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_tiktok_watchlists_project ON tiktok_watchlists(project_id);
CREATE INDEX idx_tiktok_watch_items_watchlist ON tiktok_watch_items(watchlist_id);
CREATE INDEX idx_tiktok_watch_items_enabled ON tiktok_watch_items(enabled) WHERE enabled = true;
