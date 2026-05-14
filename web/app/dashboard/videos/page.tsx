'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { IVideo } from '@/types'
import FadeUp from '@/components/ui/FadeUp'

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    ready:      { bg: 'rgba(29,158,117,0.1)',  color: '#1D9E75',              label: 'Ready' },
    processing: { bg: 'rgba(232,184,75,0.1)',  color: 'var(--color-accent)',  label: 'Processing' },
    uploading:  { bg: 'rgba(99,102,241,0.1)',  color: '#818cf8',              label: 'Uploading' },
    failed:     { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444',              label: 'Failed' },
  }
  const s = map[status] || { bg: 'rgba(255,255,255,0.04)', color: 'var(--color-text-muted)', label: status }
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

export default function MyVideosPage() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<IVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?._id) return
    fetch(`/api/videos?creator=${user._id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setVideos(data.data.videos)
        else setError('Failed to load videos')
      })
      .catch(() => setError('Failed to load videos'))
      .finally(() => setLoading(false))
  }, [user?._id])

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 rounded w-32 mb-2 animate-pulse" style={{ background: 'var(--color-bg-elevated)' }} />
            <div className="h-4 rounded w-20 animate-pulse" style={{ background: 'var(--color-bg-elevated)' }} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 animate-pulse flex gap-4"
              style={{ background: 'var(--color-bg-surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-36 aspect-video rounded-xl flex-shrink-0" style={{ background: 'var(--color-bg-elevated)' }} />
              <div className="flex-1">
                <div className="h-4 rounded mb-2 w-1/2" style={{ background: 'var(--color-bg-elevated)' }} />
                <div className="h-3 rounded w-1/4" style={{ background: 'var(--color-bg-elevated)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <FadeUp>
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold tracking-widest mb-2 uppercase"
              style={{ color: 'var(--color-accent)' }}>
              Videos
            </p>
            <h1 className="text-3xl font-bold mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
              My Videos
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {videos.length} video{videos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/dashboard/upload">
            <button className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: 'var(--color-accent)', color: '#000', border: 'none', cursor: 'pointer' }}>
              + Upload new
            </button>
          </Link>
        </div>
      </FadeUp>

      {error && (
        <p className="text-sm mb-4" style={{ color: '#ef4444' }}>{error}</p>
      )}

      {videos.length === 0 ? (
        <FadeUp delay={0.05}>
          <div className="text-center py-24 rounded-2xl border border-dashed"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="text-4xl mb-3">🎬</div>
            <p className="text-base font-bold mb-2"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
              No videos yet
            </p>
            <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
              Upload your first video to get started
            </p>
            <Link href="/dashboard/upload">
              <button className="px-6 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--color-accent)', color: '#000', border: 'none', cursor: 'pointer' }}>
                Upload your first video →
              </button>
            </Link>
          </div>
        </FadeUp>
      ) : (
        <div className="flex flex-col gap-3">
          {videos.map((video, i) => (
            <FadeUp key={video._id} delay={i * 0.04}>
              <div className="rounded-2xl p-4 flex gap-4 transition-all hover:scale-[1.01]"
                style={{ background: 'var(--color-bg-surface)', border: '1px solid rgba(255,255,255,0.06)' }}>

                {/* Thumbnail */}
                <div className="w-36 aspect-video rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                  style={{ background: 'var(--color-bg-elevated)' }}>
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title}
                      className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🎬</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-semibold text-sm truncate"
                      style={{ color: 'var(--color-text-primary)' }}>
                      {video.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusPill status={video.status} />
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: video.access === 'premium' ? 'rgba(232,52,138,0.1)' : 'rgba(29,158,117,0.1)',
                          color: video.access === 'premium' ? 'var(--color-pink)' : '#1D9E75',
                        }}>
                        {video.access === 'premium' ? 'Premium' : 'Free'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                    {video.viewCount} views · {new Date(video.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>

                  {video.status === 'ready' ? (
                    <Link href={`/video/${video._id}`}>
                      <button className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                        style={{
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'transparent',
                          color: 'var(--color-text-secondary)',
                          cursor: 'pointer',
                        }}>
                        View →
                      </button>
                    </Link>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {video.status === 'uploading' && 'Uploading...'}
                      {video.status === 'processing' && 'Processing...'}
                      {video.status === 'failed' && 'Upload failed'}
                    </span>
                  )}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      )}
    </div>
  )
}
