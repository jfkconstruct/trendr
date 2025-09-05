'use client'

import { useState } from 'react'
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
  Tooltip
} from '@mui/material'
import { 
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Analytics as AnalyticsIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material'
import Navigation from '@/components/layout/Navigation'

interface Reference {
  id: string
  platform: 'youtube' | 'instagram' | 'tiktok'
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
  const [platform, setPlatform] = useState<'youtube' | 'instagram' | 'tiktok'>('youtube')
  const [niche, setNiche] = useState('')
  const [loading, setLoading] = useState(false)
  const [references, setReferences] = useState<Reference[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleDiscover = async () => {
    if (!niche.trim()) {
      setError('Please enter a niche keyword')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ platform, niche })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to discover content')
      }

      setReferences(data.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'youtube': return 'red'
      case 'instagram': return 'pink'
      case 'tiktok': return 'black'
      default: return 'gray'
    }
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
            <Grid container spacing={2} alignItems="end">
              <Grid xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Platform</InputLabel>
                  <Select
                    value={platform}
                    label="Platform"
                    onChange={(e) => setPlatform(e.target.value as any)}
                  >
                    <MenuItem value="youtube">YouTube Shorts</MenuItem>
                    <MenuItem value="instagram">Instagram Reels</MenuItem>
                    <MenuItem value="tiktok">TikTok</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid xs={12} md={5}>
                <TextField
                  fullWidth
                  label="Niche/Keyword"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g., real estate, fitness, cooking"
                  onKeyPress={(e) => e.key === 'Enter' && handleDiscover()}
                />
              </Grid>
              
              <Grid xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleDiscover}
                  disabled={loading}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </Grid>
              
              <Grid xs={12} md={2}>
                <Tooltip title="Refresh">
                  <IconButton onClick={handleDiscover} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
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
            <Grid xs={12} md={6} lg={4} key={reference.id}>
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
                    color={getPlatformColor(reference.platform) as any}
                    sx={{ mb: 1 }}
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
                  {reference.analysis && (
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
                    <IconButton size="small" href={reference.url} target="_blank">
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Analyze">
                    <IconButton size="small" onClick={() => {}}>
                      <AnalyticsIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Generate Content">
                    <IconButton size="small" onClick={() => {}}>
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
