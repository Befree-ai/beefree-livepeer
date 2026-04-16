'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { usePrivy } from '@privy-io/react-auth'
import Badge from '@/components/ui/Badge'
import { IVideo } from '@/types'

function StatusBadge({ status }: { status: string }) {
  if (status === 'ready')      return <Badge variant="free">Ready</Badge>
  if (status === 'processing') return <Badge variant="premium">Processing</Badge>
  if (status === 'uploading')  return <Badge variant="default">Uploading</Badge>
  if (status === 'failed')     return <Badge variant="live">Failed</Badge>
  return null
}

export default function MyVideosPage() {
  const { user }          = useAuth()
  const { getAccessToken } = usePrivy()

  const [videos, setVideos]   = useState<IVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!user?._id) return

    fetch(`/api/videos?creator=${user._id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setVideos(data.data.videos)
        else setError('Failed to load videos')
      })
      .catch(() => setError('Failed to load videos'))
      .finally(() => setLoading(false))
  }, [user?._id])

  if (loading) {
    return (
      <div>
        <h1 className="font-display text-3xl font-semibold text-text-primary mb-8">
          My Videos
        </h1>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-bg-surface p-4 animate-pulse flex gap-4">
              <div className="w-32 aspect-video bg-bg-elevated rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-bg-elevated rounded w-1/2 mb-2" />
                <div className="h-3 bg-bg-elevated rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-text-primary mb-1">
            My Videos
          </h1>
          <p className="text-text-muted text-sm">
            {videos.length} video{videos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/dashboard/upload">
          <button
            className="text-sm px-4 py-2 rounded-lg border border-border bg-bg-elevated text-text-primary hover:border-border-hover transition-all"
          >
            + Upload new
          </button>
        </Link>
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      {videos.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <p className="text-text-muted text-sm mb-4">No videos yet</p>
          <Link href="/dashboard/upload">
            <button className="text-sm px-4 py-2 rounded-lg bg-accent text-black font-medium">
              Upload your first video
            </button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {videos.map((video) => (
            <div
              key={video._id}
              className="rounded-xl border border-border bg-bg-surface p-4 flex gap-4 hover:border-border-hover transition-all"
            >
              {/* Thumbnail */}
              <div className="w-36 aspect-video bg-bg-elevated rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-text-muted text-xs">No thumbnail</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="font-medium text-text-primary text-sm truncate">
                    {video.title}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={video.status} />
                    <Badge variant={video.access === 'premium' ? 'premium' : 'free'}>
                      {video.access}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-text-muted mb-3">
                  {video.viewCount} views · {new Date(video.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {video.status === 'ready' ? (
                    <Link href={`/video/${video._id}`}>
                      <button className="text-xs px-3 py-1.5 rounded-md border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-all">
                        View
                      </button>
                    </Link>
                  ) : (
                    <span className="text-xs text-text-muted">
                      {video.status === 'uploading' && 'Update status in DB to ready'}
                      {video.status === 'processing' && 'Processing...'}
                      {video.status === 'failed' && 'Upload failed'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}