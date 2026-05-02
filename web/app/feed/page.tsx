'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Badge from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { usePrivy } from '@privy-io/react-auth'
import { IVideo, ICreator } from '@/types'

interface FeedVideo extends IVideo {
  creator: ICreator
}

export default function FeedPage() {
  const { user }           = useAuth()
  const { getAccessToken } = usePrivy()

  const [videos, setVideos]     = useState<FeedVideo[]>([])
  const [loading, setLoading]   = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage]         = useState(1)
  const [hasMore, setHasMore]   = useState(true)

  const fetchFeed = useCallback(async (pageNum: number, append = false) => {
    try {
      const token = await getAccessToken().catch(() => null)
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res  = await fetch(`/api/feed?page=${pageNum}`, { headers })
      const data = await res.json()

      if (data.success) {
        if (append) {
          setVideos(prev => [...prev, ...data.data.videos])
        } else {
          setVideos(data.data.videos)
        }
        setHasMore(data.data.hasMore)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [getAccessToken])

  useEffect(() => {
    fetchFeed(1)
  }, [fetchFeed])

  const loadMore = () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    setPage(nextPage)
    fetchFeed(nextPage, true)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16 w-full">
        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold text-text-primary mb-1">
              {user?.followingCount
                ? 'Your feed'
                : 'Discover'}
            </h1>
            <p className="text-text-muted text-sm">
              {user?.followingCount
                ? 'Latest from creators you follow'
                : 'Explore music from Indian artists'}
            </p>
          </div>

          {/* Feed */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-bg-surface overflow-hidden animate-pulse">
                  <div className="aspect-video bg-bg-elevated" />
                  <div className="p-4 flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-bg-elevated flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-bg-elevated rounded w-3/4 mb-2" />
                      <div className="h-3 bg-bg-elevated rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-border rounded-xl">
              <p className="text-text-muted text-sm mb-2">No videos yet</p>
              <Link
                href="/explore"
                className="text-accent text-sm hover:underline"
              >
                Follow some creators to see their content →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {videos.map(video => (
                  <FeedVideoCard key={video._id} video={video} />
                ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="mt-10 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-6 py-2.5 rounded-lg text-sm transition-all"
                    style={{
                      border:     '1px solid var(--color-border)',
                      background: 'transparent',
                      color:      'var(--color-text-secondary)',
                      cursor:     loadingMore ? 'not-allowed' : 'pointer',
                      opacity:    loadingMore ? 0.6 : 1,
                    }}
                  >
                    {loadingMore ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </main>

      <Footer />
    </div>
  )
}

function FeedVideoCard({ video }: { video: FeedVideo }) {
  const isPremium = video.access === 'premium'
  const creator   = video.creator as ICreator

  // Thumbnail fallback using playbackId
  const thumbnail = video.thumbnailUrl
    || `https://playback.livepeer.studio/asset/hls/${video.playbackId}/thumbnails/thumbnail.png`

  return (
    <div className="rounded-xl border border-border bg-bg-surface overflow-hidden hover:border-border-hover transition-all">

      {/* Thumbnail */}
      <Link href={isPremium ? `/creator/${creator._id}` : `/video/${video._id}`}>
        <div className="aspect-video bg-bg-elevated relative overflow-hidden">
          <img
            src={thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide broken image — show fallback bg
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />

          {/* Premium lock overlay */}
          {isPremium && (
            <div className="absolute inset-0 bg-bg-primary/60 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-bg-primary/80 flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-accent"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <span className="text-xs text-accent font-medium">
                Subscribe to watch
              </span>
            </div>
          )}

          {/* Badge */}
          <div className="absolute top-2 right-2">
            <Badge variant={isPremium ? 'premium' : 'free'}>
              {video.access}
            </Badge>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4 flex gap-3">
        {/* Creator avatar */}
        <Link href={`/creator/${creator._id}`} className="flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-bg-elevated border border-border flex items-center justify-center">
            {creator.avatar ? (
              <img
                src={creator.avatar}
                alt={creator.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold text-text-secondary">
                {creator.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
        </Link>

        {/* Video info */}
        <div className="flex-1 min-w-0">
          <Link href={isPremium ? `/creator/${creator._id}` : `/video/${video._id}`}>
            <p className="font-medium text-text-primary text-sm line-clamp-2 hover:text-accent transition-colors mb-1">
              {video.title}
            </p>
          </Link>
          <Link href={`/creator/${creator._id}`}>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                {creator.name}
              </p>
              {creator.isVerified && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-accent)">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          </Link>
          <p className="text-xs text-text-muted mt-0.5">
            {video.viewCount} views
          </p>
        </div>
      </div>

    </div>
  )
}