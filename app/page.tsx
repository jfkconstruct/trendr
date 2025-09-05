'use client'

import { useEffect, useState } from 'react'
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  CircularProgress,
  Alert,
  Chip
} from '@mui/material'
import { 
  TrendingUp, 
  Search, 
  Analytics, 
  ContentPaste,
  CheckCircle,
  Error
} from '@mui/icons-material'
import Navigation from '@/components/layout/Navigation'

interface SystemHealth {
  status: string
  database: string
  llm: string
  environment: string
  checks: {
    database: string
    llm: string
    environment: Record<string, boolean>
  }
}

interface Stats {
  totalReferences: number
  totalAnalyses: number
  recentActivity: number
}

export default function Dashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHealth()
    fetchStats()
  }, [])

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealth(data)
    } catch (err) {
      setError('Failed to fetch system health')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/references?limit=1')
      const data = await response.json()
      setStats({
        totalReferences: data.total || 0,
        totalAnalyses: 0, // Will be implemented later
        recentActivity: 0 // Will be implemented later
      })
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success'
      case 'error': return 'error'
      default: return 'warning'
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle color="success" />
      case 'error': return <Error color="error" />
      default: return <CircularProgress size={20} />
    }
  }

  if (loading) {
    return (
      <Navigation>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Navigation>
    )
  }

  if (error) {
    return (
      <Navigation>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Navigation>
    )
  }

  return (
    <Navigation>
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
          {/* System Health Card */}
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUp sx={{ mr: 1 }} />
                <Typography variant="h6">System Health</Typography>
              </Box>
              
              {health && (
                <Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    {getHealthIcon(health.status)}
                    <Typography variant="body1" ml={1}>
                      Overall:
                    </Typography>
                    <Chip 
                      label={health.status} 
                      color={getHealthColor(health.status) as any}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Database: {health.checks.database}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      LLM: {health.checks.llm}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Environment: {Object.values(health.checks.environment).every(v => v) ? '✓ All set' : 'Missing variables'}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Analytics sx={{ mr: 1 }} />
                <Typography variant="h6">Quick Stats</Typography>
              </Box>
              
              {stats && (
                <Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Typography variant="body1">
                      <strong>{stats.totalReferences}</strong> References
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={2}>
                    <Typography variant="body1">
                      <strong>{stats.totalAnalyses}</strong> Analyses
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center">
                    <Typography variant="body1">
                      <strong>{stats.recentActivity}</strong> Recent Activity
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Search sx={{ mr: 1 }} />
                <Typography variant="h6">Discover Content</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" mb={3}>
                Find viral content from YouTube Shorts, Instagram Reels, and TikTok
              </Typography>
              
              <Button 
                variant="contained" 
                fullWidth 
                component="a"
                href="/discover"
              >
                Discover Content
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Analytics sx={{ mr: 1 }} />
                <Typography variant="h6">View Library</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" mb={3}>
                Browse your discovered content and analysis results
              </Typography>
              
              <Button 
                variant="outlined" 
                fullWidth 
                component="a"
                href="/library"
              >
                View Library
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ContentPaste sx={{ mr: 1 }} />
                <Typography variant="h6">Generate Content</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" mb={3}>
                Create new content based on successful patterns
              </Typography>
              
              <Button 
                variant="contained" 
                fullWidth 
                component="a"
                href="/generate"
              >
                Generate Content
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Navigation>
  )
}
