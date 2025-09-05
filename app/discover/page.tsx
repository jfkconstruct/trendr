'use client'

import { useState } from 'react'
import type React from 'react' // ✅ for React.KeyboardEvent
import type { SelectChangeEvent } from '@mui/material/Select'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment
} from '@mui/material'
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Analytics as AnalyticsIcon,
  ContentCopy as ContentCopyIcon,
  Link as LinkIcon
} from '@mui/icons-material'
// ⚠ If Navigation is a Server Component, don't import it in a client component.
// Either make Navigation a client component too, or wrap this page differently.
import Navigation from '@/components/layout/Navigation'

type Platform = 'youtube' | 'instagram' | 'tiktok'
type SearchMode = 'keyword' | 'url'

interface Reference {
  id: string
  platform: Platform
  url: string
  title: string
  creator: string
  metrics: {
    views: number
    likes: number
    comments: number
    engagementRate: number
    duration: number
  }
  viralScore: number
  thumbnailUrl?: string
  analysis?: any
}

export default function DiscoverPage() {
  const [platform, setPlatform] = useState<Platform>('youtube')
  const [niche, setNiche] = useState('')
  const [tiktokUrl, setTiktokUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [references, setReferences] = useState<Reference[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchMode, setSearchMode] = useState<SearchMode>('keyword')

  const handleDiscover = async () => {
    const isTikTokUrlMode = platform === 'tiktok' && searchMode === 'url'
    const payload = {
      platform,
      niche: isTikTokUrlMode ? tiktokUrl.trim() : niche.trim(),
    }

    if (isTikTokUrlMode && !payload.niche) {
      setError('Please enter a TikTok URL')
      return
    }
    if (!isTikTokUrlMode && !payload.niche) {
      setError('Please enter a niche keyword')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to discover content')
      setReferences(Array.isArray(data.items) ? data.items : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
    return num.toString()
  }

  // Use sx for custom colors instead of Chip.color (which only accepts theme palette keys)
  const getPlatformChipSx = (p: Platform) => {
    switch (p) {
      case 'youtube':
        return { bgcolor: '#FF0033', color: '#fff' }
      case 'instagram':
        return { bgcolor: '#E1306C', color: '#fff' }
      case 'tiktok':
        return { bgcolor: '#111827', color: '#fff' }
    }
  }

  const handlePlatformChange = (e: SelectChangeEvent<Platform>) => {
    const newPlatform = e.target.value as Platform
    setPlatform(newPlatform)
    setSearchMode(newPlatform === 'tiktok' ? 'url' : 'keyword')
    setNiche('')
    setTiktokUrl('')
    setError(null)
  }

  // Use onKeyDown (onKeyPress is deprecated)
  const handleEnterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleDiscover()
  }

  return (
    <Navigation>
      <Box>
        <Typography variant="h4" gutterBottom>
          Discover Content
        </Typography>

        {/* Search Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  {/* Link label + select with ids to avoid MUI warnings */}
                  <InputLabel id="platform-label">Platform</InputLabel>
                  <Select
                    labelId="platform-label"
                    id="platform-select"
                    value={platform}
                    label="Platform"
                    onChange={handlePlatformChange}
                  >
                    <MenuItem value="youtube">YouTube Shorts</MenuItem>
                    <MenuItem value="instagram">Instagram Reels</MenuItem>
                    <MenuItem value="tiktok">TikTok</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {platform === 'tiktok' && searchMode === 'url' ? (
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label="TikTok URL"
                    value={tiktokUrl}
                    onChange={(e) => setTiktokUrl(e.target.value)}
                    placeholder="https://www.tiktok.com/@username/video/1234567890"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkIcon />
                        </InputAdornment>
                      ),
                    }}
                    onKeyDown={handleEnterKey}
                  />
                </Grid>
              ) : (
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label="Niche/Keyword"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g., real estate, fitness, cooking"
                    onKeyDown={handleEnterKey}
                  />
                </Grid>
              )}

              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleDiscover}
                  disabled={loading}
                >
                  {loading ? 'Searching...' : platform === 'tiktok' && searchMode === 'url' ? 'Add' : 'Search'}
                </Button>
              </Grid>

              {platform === 'tiktok' && (
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setSearchMode(searchMode === 'keyword' ? 'url' : 'keyword')}
                    disabled={loading}
                  >
                    {searchMode === 'keyword' ? 'URL Mode' : 'Keyword Mode'}
                  </Button>
                </Grid>
              )}

              {platform !== 'tiktok' && (
                <Grid item xs={12} md={2}>
                  <Tooltip title="Refresh">
                    <span>
                      {/* wrap IconButton in span so Tooltip still shows while disabled */}
                      <IconButton onClick={handleDiscover} disabled={loading}>
                        <RefreshIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Results */}
        {references.length > 0 && (
          <Typography variant="h6" gutterBottom>
            Found {references.length} results
          </Typography>
        )}

        <Grid container spacing={3}>
          {references.map((reference) => (
            <Grid item xs={12} md={6} lg={4} key={reference.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Thumbnail */}
                  {reference.thumbnailUrl && (
                    <Box
                      component="img"
                      src={reference.thumbnailUrl}
                      alt={reference.title}
                      sx={{
                        width: '100%',
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 1,
                        mb: 2
                      }}
                    />
                  )}

                  {/* Platform Badge */}
                  <Chip
                    label={reference.platform.toUpperCase()}
                    size="small"
                    sx={{ mb: 1, ...getPlatformChipSx(reference.platform) }}
                  />

                  {/* Title */}
                  <Typography variant="h6" gutterBottom noWrap>
                    {reference.title}
                  </Typography>

                  {/* Creator */}
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    by {reference.creator}
                  </Typography>

                  {/* Metrics */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Views: {formatNumber(reference.metrics.views)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Likes: {formatNumber(reference.metrics.likes)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Engagement: {reference.metrics.engagementRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Duration: {reference.metrics.duration}s
                    </Typography>
                  </Box>

                  {/* Viral Score */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Viral Score:
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {reference.viralScore.toFixed(1)}/100
                    </Typography>
                  </Box>

                  {/* Analysis Status */}
                  {!!reference.analysis && (
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label="Analyzed"
                        color="success"
                        size="small"
                        icon={<AnalyticsIcon />}
                      />
                    </Box>
                  )}
                </CardContent>

                {/* Actions */}
                <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                  <Tooltip title="View">
                    <IconButton size="small" href={reference.url} target="_blank" rel="noreferrer">
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Analyze">
                    <IconButton size="small" onClick={() => { /* TODO: wire analyzer */ }}>
                      <AnalyticsIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Generate Content">
                    <IconButton size="small" onClick={() => { /* TODO: wire generator */ }}>
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Loading State */}
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        )}

        {/* Empty State */}
        {!loading && references.length === 0 && !error && (
          <Box textAlign="center" py={8}>
            <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No content discovered yet
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Enter a niche keyword and select a platform to discover viral content
            </Typography>
          </Box>
        )}
      </Box>
    </Navigation>
  )
}
