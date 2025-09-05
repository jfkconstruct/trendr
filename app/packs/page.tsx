import { getSupabaseAdmin } from '@/lib/supabase/server'
import PackViewer from '@/components/PackViewer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function PacksPage({
  searchParams
}: {
  searchParams: { projectId: string }
}) {
  if (!searchParams.projectId) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold mb-4">Project ID required</h2>
        <p>Please specify a project ID in the URL parameters</p>
      </div>
    )
  }

  const supabase = getSupabaseAdmin()
  const { data: packs, error } = await supabase
    .from('packs')
    .select('*, reference:content_references(title, platform, thumbnail_url)')
    .eq('project_id', searchParams.projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching packs:', error)
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold mb-4">Error loading packs</h2>
        <p>Failed to fetch packs for this project</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Content Packs</h2>
        <Button asChild>
          <Link href={`/generate?projectId=${searchParams.projectId}`}>
            Create New Pack
          </Link>
        </Button>
      </div>

      {packs?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map((pack) => (
            <PackViewer 
              key={pack.id}
              pack={pack}
              onDuplicate={async (packId) => {
                try {
                  const response = await fetch(`/api/packs/${packId}/duplicate`, {
                    method: 'POST'
                  })
                  if (!response.ok) {
                    throw new Error('Failed to duplicate pack')
                  }
                  // Refresh the pack list after duplication
                  window.location.reload()
                } catch (error) {
                  console.error('Error duplicating pack:', error)
                  alert('Failed to duplicate pack')
                }
              }}
              onRegenerate={() => console.log('Regenerate')}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No packs yet</h3>
          <p className="text-gray-500">Create your first pack to get started</p>
        </div>
      )}
    </div>
  )
}
