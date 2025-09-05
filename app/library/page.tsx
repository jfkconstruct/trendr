'use client'

import { useState, useEffect } from 'react'
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material'
import { 
  Visibility as VisibilityIcon,
  Analytics as AnalyticsIcon,
  ContentCopy as ContentCopyIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon
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
  analysis?: {
    hooks: Array<{
      type: string
      timestamp: number
      text: string
    }>
    structure: {
      pacing: 'fast' | 'medium' | 'slow'
      segments: Array<{
        type: string
        start: number
        end: number
      }>
    }
    contentMetrics: {
      duration: number
      textDensity: number
      hookTiming: number
    }
    whyWorked: string[]
  }
}

interface FilterState {
  platform: string
  minViralScore: number
  hasAnalysis: boolean
}

export default function LibraryPage() {
  const [references, setReferences] = useState<Reference[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReference, setSelectedReference] = useState<Reference | null>(null)
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    platform: 'all',
    minViralScore: 0,
    hasAnalysis: false
  })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchReferences()
  }, [])

  const fetchReferences = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/references')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch references')
      }

      setReferences(data.references || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const filteredReferences = references.filter((ref) => {
    if (filters.platform !== 'all' && ref.platform !== filters.platform) return false
    if (ref.viralScore < filters.minViralScore) return false
    if (filters.hasAnalysis && !ref.analysis) return false
    if (searchTerm && !ref.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !ref.creator.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

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
      case 'youtube': return 'error'
      case 'instagram': return 'secondary'
      case 'tiktok': return 'primary'
      default: return 'default'
    }
  }

  const handleViewAnalysis = (reference: Reference) => {
    setSelectedReference(reference)
    setAnalysisDialogOpen(true)
  }

  const handleGenerateContent = (reference: Reference) => {
    // Navigate to generate page with reference ID
    window.location.href = `/generate?reference=${reference.id}`
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Navigation>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            Content Library
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilterDialogOpen(true)}
            >
              Filters
            </Button>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={fetchReferences}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Search Bar */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          <TextField
            fullWidth
            placeholder="Search by title or creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Results */}
        <Typography variant="h6" gutterBottom>
          {filteredReferences.length} of {references.length} references
        </Typography>

        <Grid container spacing={3}>
          {filteredReferences.map((reference) => (
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
                    color={getPlatformColor(reference.platform)}
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
                      Engagement: {reference.metrics.engagementRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Duration: {formatTime(reference.metrics.duration)}
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
                  
                  <Tooltip title="View Analysis">
                    <IconButton 
                      size="small" 
                      onClick={() => handleViewAnalysis(reference)}
                      disabled={!reference.analysis}
                    >
                      <AnalyticsIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Generate Content">
                    <IconButton size="small" onClick={() => handleGenerateContent(reference)}>
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
        {!loading && filteredReferences.length === 0 && (
          <Box textAlign="center" py={8}>
            <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No content found
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Try adjusting your filters or search terms
            </Typography>
          </Box>
        )}

        {/* Analysis Dialog */}
        <Dialog 
          open={analysisDialogOpen} 
          onClose={() => setAnalysisDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Analysis Results
          </DialogTitle>
          <DialogContent>
            {selectedReference?.analysis && (
              <Box>
                {/* Why It Worked */}
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    Why It Worked
                  </Typography>
                  <ul>
                    {selectedReference.analysis.whyWorked.map((reason, index) => (
                      <li key={index} style={{ marginBottom: '8px' }}>
                        <Typography variant="body2">{reason}</Typography>
                      </li>
                    ))}
                  </ul>
                </Box>

                {/* Hooks */}
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    Hooks
                  </Typography>
                  {selectedReference.analysis.hooks.map((hook, index) => (
                    <Box key={index} mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        {formatTime(hook.timestamp)} - {hook.type}
                      </Typography>
                      <Typography variant="body1">{hook.text}</Typography>
                    </Box>
                  ))}
                </Box>

                {/* Structure */}
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    Content Structure
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Pacing: {selectedReference.analysis.structure.pacing}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Duration: {formatTime(selectedReference.analysis.contentMetrics.duration)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Text Density: {selectedReference.analysis.contentMetrics.textDensity.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAnalysisDialogOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Filter Dialog */}
        <Dialog 
          open={filterDialogOpen} 
          onClose={() => setFilterDialogOpen(false)}
          maxWidth="sm"
        >
          <DialogTitle>
            Filters
          </DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Platform</InputLabel>
              <Select
                value={filters.platform}
                label="Platform"
                onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
              >
                <MenuItem value="all">All Platforms</MenuItem>
                <MenuItem value="youtube">YouTube Shorts</MenuItem>
                <MenuItem value="instagram">Instagram Reels</MenuItem>
                <MenuItem value="tiktok">TikTok</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Minimum Viral Score"
              type="number"
              value={filters.minViralScore}
              onChange={(e) => setFilters({ ...filters, minViralScore: parseFloat(e.target.value) || 0 })}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <Select
                value={filters.hasAnalysis ? 'true' : 'false'}
                label="Analysis Status"
                onChange={(e) => setFilters({ ...filters, hasAnalysis: e.target.value === 'true' })}
              >
                <MenuItem value="false">All Content</MenuItem>
                <MenuItem value="true">Analyzed Only</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFilterDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setFilterDialogOpen(false)} variant="contained">
              Apply Filters
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Navigation>
  )
}
