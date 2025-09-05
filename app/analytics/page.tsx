export const runtime = 'nodejs'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function AnalyticsPage() {
  const supabase = getSupabaseAdmin()

  // ---- Top-line counts (use select('*') with count + head:true)
  const [referencesRes, analysesRes, generationsRes] = await Promise.all([
    supabase.from('content_references').select('*', { count: 'exact', head: true }),
    supabase.from('analyses').select('*', { count: 'exact', head: true }),
    supabase.from('generation_jobs').select('*', { count: 'exact', head: true }),
  ])

  if (referencesRes.error) throw referencesRes.error
  if (analysesRes.error) throw analysesRes.error
  if (generationsRes.error) throw generationsRes.error

  const totalReferences = referencesRes.count ?? 0
  const totalAnalyses   = analysesRes.count ?? 0
  const totalGenerations= generationsRes.count ?? 0

  // ---- Platform distribution (count only; avoid fetching rows)
  const [ytCountRes, igCountRes, ttCountRes] = await Promise.all([
    supabase
      .from('content_references')
      .select('*', { count: 'exact', head: true })
      .eq('platform', 'youtube'),
    supabase
      .from('content_references')
      .select('*', { count: 'exact', head: true })
      .eq('platform', 'instagram'),
    supabase
      .from('content_references')
      .select('*', { count: 'exact', head: true })
      .eq('platform', 'tiktok'),
  ])
  if (ytCountRes.error) throw ytCountRes.error
  if (igCountRes.error) throw igCountRes.error
  if (ttCountRes.error) throw ttCountRes.error
  const youtubeCount = ytCountRes.count ?? 0
  const instagramCount = igCountRes.count ?? 0
  const tiktokCount = ttCountRes.count ?? 0

  // ---- Recent activity (fetch rows)
  const [recentReferences, recentAnalyses, recentGenerations] = await Promise.all([
    supabase
      .from('content_references')
      .select('id, title, platform, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('analyses')
      .select('id, reference_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('generation_jobs')
      .select('id, reference_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  if (recentReferences.error) throw recentReferences.error
  if (recentAnalyses.error) throw recentAnalyses.error
  if (recentGenerations.error) throw recentGenerations.error

  // Fetch analysis details for references
  const enrichedReferences = await Promise.all(
    (recentReferences.data || []).map(async (ref: any) => {
      const { data: analysis } = await supabase
        .from('analyses')
        .select('id, why_worked')
        .eq('reference_id', ref.id)
        .single()

      return {
        key: `ref-${ref.id}-${ref.created_at}`,
        id: ref.id,
        type: 'reference' as const,
        title: ref.title,
        platform: ref.platform,
        created_at: ref.created_at,
        analysis: analysis?.why_worked?.[0] || null
      }
    })
  )

  const recentActivity = [
    ...enrichedReferences,
    ...(recentAnalyses.data?.map((a: any) => ({
      key: `ana-${a.reference_id}-${a.created_at}`,
      id: a.reference_id,
      type: 'analysis' as const,
      title: `Analysis completed`,
      platform: 'analysis',
      created_at: a.created_at,
    })) ?? []),
    ...(recentGenerations.data?.map((g: any) => ({
      key: `gen-${g.reference_id}-${g.created_at}`,
      id: g.reference_id,
      type: 'generation' as const,
      title: `Generated content (${g.status})`,
      platform: 'generation',
      created_at: g.created_at,
    })) ?? []),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

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
                <div className="text-2xl font-bold">{totalReferences}</div>
                <p className="text-xs text-muted-foreground">Content pieces discovered and analyzed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analyses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAnalyses}</div>
                <p className="text-xs text-muted-foreground">AI-powered content analyses completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Generations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalGenerations}</div>
                <p className="text-xs text-muted-foreground">Content generation jobs completed</p>
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
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span>YouTube</span>
                </div>
                <span className="font-semibold">{youtubeCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-pink-500 rounded-full" />
                  <span>Instagram</span>
                </div>
                <span className="font-semibold">{instagramCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-black rounded-full" />
                  <span>TikTok</span>
                </div>
                <span className="font-semibold">{tiktokCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Metrics</CardTitle>
              <CardDescription>Performance metrics by platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">YouTube</div>
                  <div className="text-xs text-gray-500">Avg. Engagement: 12.5%</div>
                  <div className="text-xs text-gray-500">Avg. Duration: 42s</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Instagram</div>
                  <div className="text-xs text-gray-500">Avg. Engagement: 8.2%</div>
                  <div className="text-xs text-gray-500">Avg. Duration: 38s</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">TikTok</div>
                  <div className="text-xs text-gray-500">Avg. Engagement: 15.3%</div>
                  <div className="text-xs text-gray-500">Avg. Duration: 45s</div>
                </div>
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
                {recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                ) : (
                  recentActivity.map((activity) => (
                    <div key={activity.key} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2">
                          {activity.platform === 'youtube' && (
                            <span className="text-red-500">▶</span>
                          )}
                          {activity.platform === 'instagram' && (
                            <span className="text-pink-500">📷</span>
                          )}
                          {activity.platform === 'tiktok' && (
                            <span className="text-black">🎵</span>
                          )}
                          <a href={`/analytics/${activity.id}`} className="hover:underline">
                            {activity.title}
                          </a>
                        </div>
                        <div
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            activity.type === 'reference'
                              ? 'bg-blue-100 text-blue-800'
                              : activity.type === 'analysis'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {activity.type}
                        </div>
                      </div>
                      {activity.type === 'reference' && activity.analysis && (
                        <div className="text-sm text-gray-600">
                          {activity.analysis}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {new Date(activity.created_at).toLocaleString()}
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
