import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Copy, RefreshCw, Eye } from 'lucide-react'

interface PackViewerProps {
  pack: {
    id: string
    platform: string
    created_at: string
    contents: {
      script: string
      captions?: string
      hashtags?: string[]
      cta?: string
    }
    reference?: {
      title: string
      platform: string
      thumbnail_url?: string
    }
  }
  onDuplicate?: (packId: string) => Promise<void>
  onRegenerate?: (packId: string) => void
  onDuplicated?: () => void
}

export default function PackViewer({ pack, onDuplicate, onRegenerate }: PackViewerProps) {
  const platformColors = {
    youtube: 'bg-red-100 text-red-800',
    instagram: 'bg-pink-100 text-pink-800',
    tiktok: 'bg-blue-100 text-blue-800'
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            {pack.reference?.title || 'Generated Pack'}
          </CardTitle>
          <Badge className={platformColors[pack.platform as keyof typeof platformColors] || 'bg-gray-100 text-gray-800'}>
            {pack.platform}
          </Badge>
        </div>
        <div className="text-sm text-gray-500">
          Created: {new Date(pack.created_at).toLocaleString()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {pack.reference?.thumbnail_url && (
          <div className="relative aspect-video rounded-md overflow-hidden">
            <img 
              src={pack.reference.thumbnail_url}
              alt="Reference thumbnail"
              className="object-cover w-full h-full"
            />
          </div>
        )}

        <div className="space-y-2">
          <h3 className="font-medium">Script Preview</h3>
          <p className="text-sm line-clamp-3 text-gray-600">
            {pack.contents.script}
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/packs/${pack.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDuplicate?.(pack.id)}
          >
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onRegenerate?.(pack.id)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
