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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  Divider
} from '@mui/material'
import { 
  ContentCopy as ContentCopyIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material'
import Navigation from '@/components/layout/Navigation'
import ModelSelector from '@/components/ModelSelector'
import { useRouter } from 'next/navigation'

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

interface GenerationResult {
  script: string
  captions: string
  hashtags: string[]
  beats: Array<{ t: number; beat: string }>
  broll: Array<{ t: number; cue: string }>
  thumbnailBrief: string
  subtitles: string
}

const steps = ['Select Reference', 'Configure Offer', 'Generate Content', 'Review Results']

export default function GeneratePage() {
  const router = useRouter()
  const [referenceId, setReferenceId] = useState<string>('')
  const [reference, setReference] = useState<Reference | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)
  
  // Offer configuration
  const [offer, setOffer] = useState({
    problem: '',
    promise: '',
    proof: '',
    pitch: ''
  })
  
  // Model configuration
  const [selectedModel, setSelectedModel] = useState(process.env.LLM_MODEL || 'anthropic/claude-3.5-sonnet')

  useEffect(() => {
    // Check for reference ID in URL params
    const params = new URLSearchParams(window.location.search)
    const refId = params.get('reference')
    if (refId) {
      setReferenceId(refId)
      fetchReference(refId)
    }
  }, [])

  const fetchReference = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/references/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reference')
      }

      setReference(data.reference)
      setActiveStep(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!reference || !reference.analysis) {
      setError('Please select a reference with analysis')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          referenceId: reference.id,
          offer
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content')
      }

      setGenerationResult(data)
      setActiveStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (activeStep === 0) {
      router.push('/discover')
    } else {
      setActiveStep(activeStep - 1)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'youtube': return 'error'
      case 'instagram': return 'secondary'
      case 'tiktok': return 'primary'
      default: return 'default'
    }
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select a Reference to Generate Content From
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Choose from your analyzed content library to generate new content based on successful patterns.
            </Typography>
            
            {loading && (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {!loading && !reference && (
              <Box textAlign="center" py={8}>
                <ContentCopyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No reference selected
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Go to your library and select a reference to generate content from
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => router.push('/library')}
                  sx={{ mt: 2 }}
                >
                  Browse Library
                </Button>
              </Box>
            )}

            {reference && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Chip
                      label={reference.platform.toUpperCase()}
                      size="small"
                      color={getPlatformColor(reference.platform)}
                      sx={{ mr: 2 }}
                    />
                    <Typography variant="h6">
                      {reference.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    by {reference.creator}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Viral Score: {reference.viralScore.toFixed(1)}/100
                  </Typography>
                  
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(1)}
                    sx={{ mt: 2 }}
                  >
                    Configure Offer
                  </Button>
                </CardContent>
              </Card>
            )}
          </Box>
        )

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Your Offer & Model
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Describe your offer using the 4Ps framework and select your preferred AI model.
            </Typography>
            
            {/* Model Selector */}
            <ModelSelector 
              onModelChange={setSelectedModel}
              currentModel={selectedModel}
            />
            <Box sx={{ mb: 3 }} />
            
            {reference && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Generating content based on:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    "{reference.title}"
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Analysis: {reference.analysis?.whyWorked.slice(0, 2).join('; ')}
                  </Typography>
                </CardContent>
              </Card>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="Problem"
                value={offer.problem}
                onChange={(e) => setOffer({ ...offer, problem: e.target.value })}
                placeholder="What problem does your offer solve?"
                multiline
                rows={3}
              />
              
              <TextField
                fullWidth
                label="Promise"
                value={offer.promise}
                onChange={(e) => setOffer({ ...offer, promise: e.target.value })}
                placeholder="What benefit do you promise?"
                multiline
                rows={3}
              />
              
              <TextField
                fullWidth
                label="Proof"
                value={offer.proof}
                onChange={(e) => setOffer({ ...offer, proof: e.target.value })}
                placeholder="What proof or evidence supports your claim?"
                multiline
                rows={3}
              />
              
              <TextField
                fullWidth
                label="Pitch"
                value={offer.pitch}
                onChange={(e) => setOffer({ ...offer, pitch: e.target.value })}
                placeholder="What's your call to action?"
                multiline
                rows={3}
              />
            </Box>

            <Box display="flex" justifyContent="space-between" mt={3}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button 
                variant="contained" 
                onClick={() => setActiveStep(2)}
                disabled={!offer.problem || !offer.promise || !offer.proof || !offer.pitch}
              >
                Next
              </Button>
            </Box>
          </Box>
        )

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Generate Content
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              AI is creating your content based on the reference and your offer configuration...
            </Typography>
            
            {loading && (
              <Box display="flex" flexDirection="column" alignItems="center" py={8}>
                <CircularProgress size={48} sx={{ mb: 2 }} />
                <Typography variant="body1">
                  Generating content...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This may take 10-20 seconds
                </Typography>
              </Box>
            )}

            {!loading && generationResult && (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  Content generated successfully!
                </Alert>
                <Button 
                  variant="contained" 
                  onClick={() => setActiveStep(3)}
                  sx={{ mb: 3 }}
                >
                  View Results
                </Button>
              </Box>
            )}

            {!loading && !generationResult && !loading && (
              <Box display="flex" justifyContent="center" py={8}>
                <Button 
                  variant="contained" 
                  onClick={handleGenerate}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <ContentCopyIcon />}
                >
                  {loading ? 'Generating...' : 'Generate Content'}
                </Button>
              </Box>
            )}
          </Box>
        )

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Generated Content
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Your content has been generated based on the successful reference pattern.
            </Typography>

            {generationResult && (
              <Box>
                {/* Script */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Script
                    </Typography>
                    <Typography variant="body2" whiteSpace="pre-wrap">
                      {generationResult.script}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Captions */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Captions
                    </Typography>
                    <Typography variant="body2">
                      {generationResult.captions}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Hashtags */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Hashtags
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {generationResult.hashtags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" />
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                {/* Beats */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Content Structure (Beats)
                    </Typography>
                    <Box>
                      {generationResult.beats.map((beat, index) => (
                        <Box key={index} mb={2}>
                          <Typography variant="body2" color="text.secondary">
                            {formatTime(beat.t)} - {beat.beat}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                {/* B-Roll */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      B-Roll Suggestions
                    </Typography>
                    <Box>
                      {generationResult.broll.map((cue, index) => (
                        <Box key={index} mb={2}>
                          <Typography variant="body2" color="text.secondary">
                            {formatTime(cue.t)} - {cue.cue}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                {/* Thumbnail Brief */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Thumbnail Brief
                    </Typography>
                    <Typography variant="body2">
                      {generationResult.thumbnailBrief}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <Box display="flex" gap={2}>
                  <Button 
                    variant="contained" 
                    startIcon={<SaveIcon />}
                    onClick={() => {
                      // Save functionality
                    }}
                  >
                    Save
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<ShareIcon />}
                    onClick={() => {
                      // Share functionality
                    }}
                  >
                    Share
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      // Download functionality
                    }}
                  >
                    Download
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Navigation>
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <Button onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </Button>
          <Typography variant="h4">
            Generate Content
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Step Content */}
        {renderStepContent()}
      </Box>
    </Navigation>
  )
}
