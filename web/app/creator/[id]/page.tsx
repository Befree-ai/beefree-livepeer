'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Badge from '@/components/ui/Badge'
import { ICreator, IVideo } from '@/types'
import Link from 'next/link'

function VideoCard({ video }: { video: IVideo }) {
  return (
    <Link
      href={`/video/${video._id}`}
      className="group block rounded-xl border border-border bg-bg-surface overflow-hidden hover:border-border-hover transition-all"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-bg-elevated flex items-center justify-center relative">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-text-muted text-sm">No thumbnail</div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={video.access === 'premium' ? 'premium' : 'free'}>
            {video.access}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-medium text-text-primary text-sm group-hover:text-accent transition-colors line-clamp-2">
          {video.title}
        </p>
        <p className="text-xs text-text-muted mt-1">
          {video.viewCount} views
        </p>
      </div>
    </Link>
  )
}

export default function CreatorProfilePage() {
  const params = useParams()
  const id = params?.id as string

  const [creator, setCreator] = useState<ICreator | null>(null)
  const [videos, setVideos]   = useState<IVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    fetch(`/api/creators/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCreator(data.data.creator)
          setVideos(data.data.videos)
        } else {
          setError('Creator not found')
        }
      })
      .catch(() => setError('Failed to load creator'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 max-w-6xl mx-auto px-6 py-12 w-full">
          <div className="animate-pulse">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-bg-elevated" />
              <div>
                <div className="h-6 bg-bg-elevated rounded w-48 mb-2" />
                <div className="h-4 bg-bg-elevated rounded w-32" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-bg-surface">
                  <div className="aspect-video bg-bg-elevated" />
                  <div className="p-4">
                    <div className="h-4 bg-bg-elevated rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <p className="text-text-muted">{error || 'Creator not found'}</p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16 w-full">
        <div className="max-w-6xl mx-auto px-6 py-12">

          {/* Creator Header */}
          <div className="flex items-start gap-6 mb-10 pb-10 border-b border-border">
            <div className="w-24 h-24 rounded-full bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0">
              {creator.avatar ? (
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-3xl font-semibold text-text-secondary">
                  {creator.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="font-display text-3xl font-semibold text-text-primary">
                  {creator.name}
                </h1>
                {creator.isVerified && (
                  <Badge variant="verified">Verified</Badge>
                )}
              </div>

              <p className="text-text-muted text-sm mb-3">
                {creator.followersCount} followers
              </p>

              {creator.bio && (
                <p className="text-text-secondary text-sm max-w-xl">
                  {creator.bio}
                </p>
              )}

              {creator.genre && creator.genre.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {creator.genre.map((g) => (
                    <span
                      key={g}
                      className="text-xs px-2.5 py-1 rounded-full border border-border text-text-muted"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Videos */}
          <div>
            <h2 className="font-display text-2xl font-semibold text-text-primary mb-6">
              Videos
            </h2>

            {videos.length === 0 ? (
              <div className="text-center py-16 border border-border rounded-xl">
                <p className="text-text-muted text-sm">
                  No videos yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <VideoCard key={video._id} video={video} />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}