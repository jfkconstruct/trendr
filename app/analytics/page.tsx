'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AnalyticsData {
  totalReferences: number
  totalAnalyses: number
  totalGenerations: number
  platformStats: {
    youtube: number
    instagram: number
    tiktok: number
  }
  recentActivity: Array<{
    id: string
    type: 'reference' | 'analysis' | 'generation'
    title: string
    platform: string
    created_at: string
  }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if Supabase is properly configured
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        setError('Supabase configuration missing. Analytics data unavailable.')
        setLoading(false)
        return
      }

      // Fetch total counts
      const [{ count: totalReferences }, { count: totalAnalyses }, { count: totalGenerations }] = await Promise.all([
        supabaseClient.from('content_references').select('*', { count: 'exact', head: true }),
        supabaseClient.from('analyses').select('*', { count: 'exact', head: true }),
        supabaseClient.from('generation_jobs').select('*', { count: 'exact', head: true })
      ])

      // Fetch platform statistics
      const { data: platformData } = await supabaseClient
        .from('content_references')
        .select('platform')
        .eq('platform', 'youtube')

      const platformStats = {
        youtube: platformData?.length || 0,
        instagram: 0, // Will be implemented when Instagram is added
        tiktok: 0     // Will be implemented when TikTok is added
      }

      // Fetch recent activity
      const { data: recentReferences } = await supabaseClient
        .from('content_references')
        .select('id, title, platform, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: recentAnalyses } = await supabaseClient
        .from('analyses')
        .select('id, reference_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: recentGenerations } = await supabaseClient
        .from('generation_jobs')
        .select('id, reference_id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      // Combine recent activity
      const recentActivity = [
        ...(recentReferences?.map(ref => ({
          id: ref.id,
          type: 'reference' as const,
          title: ref.title,
          platform: ref.platform,
          created_at: ref.created_at
        })) || []),
        ...(recentAnalyses?.map(analysis => ({
          id: analysis.reference_id,
          type: 'analysis' as const,
          title: `Analysis for ${analysis.reference_id}`,
          platform: 'analysis',
          created_at: analysis.created_at
        })) || []),
        ...(recentGenerations?.map(gen => ({
          id: gen.reference_id,
          type: 'generation' as const,
          title: `Generation ${gen.status} for ${gen.reference_id}`,
          platform: 'generation',
          created_at: gen.created_at
        })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10)

      setData({
        totalReferences: totalReferences || 0,
        totalAnalyses: totalAnalyses || 0,
        totalGenerations: totalGenerations || 0,
        platformStats,
        recentActivity
      })

    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">No data available</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Overview of your AI Content Agent Platform activity</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total References</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalReferences}</div>
                <p className="text-xs text-muted-foreground">
                  Content pieces discovered and analyzed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analyses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalAnalyses}</div>
                <p className="text-xs text-muted-foreground">
                  AI-powered content analyses completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Generations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalGenerations}</div>
                <p className="text-xs text-muted-foreground">
                  Content generation jobs completed
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Distribution</CardTitle>
              <CardDescription>Content distribution across platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>YouTube</span>
                </div>
                <span className="font-semibold">{data.platformStats.youtube}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                  <span>Instagram</span>
                </div>
                <span className="font-semibold">{data.platformStats.instagram}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-black rounded-full"></div>
                  <span>TikTok</span>
                </div>
                <span className="font-semibold">{data.platformStats.tiktok}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest activities across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                ) : (
                  data.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{activity.title}</div>
                        <div className="text-sm text-gray-500">
                          {activity.type} • {activity.platform} • {new Date(activity.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        activity.type === 'reference' ? 'bg-blue-100 text-blue-800' :
                        activity.type === 'analysis' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {activity.type}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
