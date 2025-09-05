import { getSupabaseAdmin } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AnalysisDetails from '@/components/AnalysisDetails'

export default async function AnalysisPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin()

  // Fetch reference and analysis data
  const { data: reference } = await supabase
    .from('content_references')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!reference) {
    return notFound()
  }

  const { data: analysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('reference_id', params.id)
    .single()

  if (!analysis) {
    return notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analysis Details</h1>
        <p className="text-gray-600">
          Deep dive into content performance for: {reference.title}
        </p>
      </div>

      <AnalysisDetails reference={reference} analysis={analysis} />
    </div>
  )
}
