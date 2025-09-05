import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Hook {
  type: string
  timestamp: number
  text?: string
}

interface Segment {
  type: string
  start: number
  end: number
}

interface AnalysisDetailsProps {
  reference: {
    platform: string
    title: string
    metrics: {
      views: number
      likes: number
      comments: number
      engagementRate: number
      duration: number
    }
  }
  analysis: {
    hooks: Hook[]
    structure: {
      pacing: string
      segments: Segment[]
    }
    why_worked: string[]
  }
}

export default function AnalysisDetails({ reference, analysis }: AnalysisDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Content Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium">Platform</div>
            <div className="text-sm text-gray-600 capitalize">{reference.platform}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Duration</div>
            <div className="text-sm text-gray-600">{reference.metrics.duration}s</div>
          </div>
          <div>
            <div className="text-sm font-medium">Views</div>
            <div className="text-sm text-gray-600">{reference.metrics.views.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Engagement Rate</div>
            <div className="text-sm text-gray-600">{reference.metrics.engagementRate}%</div>
          </div>
        </CardContent>
      </Card>

      {/* Hook Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Hook Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis.hooks.map((hook, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="font-medium capitalize">{hook.type}</div>
              {hook.text && (
                <div className="text-sm text-gray-600 mt-1">"{hook.text}"</div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                At {hook.timestamp}s
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Content Structure */}
      <Card>
        <CardHeader>
          <CardTitle>Content Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            <span className="font-medium">Pacing: </span>
            <span className="capitalize">{analysis.structure.pacing}</span>
          </div>
          <div className="space-y-2">
            {analysis.structure.segments.map((segment, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 font-medium capitalize">{segment.type}</div>
                <div className="flex-1 text-sm text-gray-600">
                  {segment.start}s - {segment.end}s
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Why It Worked */}
      <Card>
        <CardHeader>
          <CardTitle>Why It Worked</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="list-disc list-inside">
            {analysis.why_worked.map((reason, index) => (
              <li key={index} className="text-sm text-gray-700">
                {reason}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
