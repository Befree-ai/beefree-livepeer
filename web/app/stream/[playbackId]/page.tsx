'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import * as Player from '@livepeer/react/player'
import { getSrc } from '@livepeer/react/external'
import Navbar from '@/components/layout/Navbar'
import Badge from '@/components/ui/Badge'

export default function StreamViewerPage() {
  const params     = useParams()
  const playbackId = params?.playbackId as string

  const [src, setSrc]         = useState<ReturnType<typeof getSrc>>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!playbackId) return

    fetch(`/api/playback/${playbackId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSrc(getSrc(data.data.playbackInfo))
        } else {
          setError('Stream not found')
        }
      })
      .catch(() => setError('Failed to load stream'))
      .finally(() => setLoading(false))
  }, [playbackId])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 w-full">
        <div className="max-w-5xl mx-auto px-6 py-10">

          <div className="flex items-center gap-3 mb-6">
            <h1 className="font-display text-2xl font-semibold text-text-primary">
              Live Stream
            </h1>
            <Badge variant="live">Live</Badge>
          </div>

          <div className="rounded-xl overflow-hidden border border-border" style={{ background: '#000' }}>
            {loading ? (
              <div className="aspect-video flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: '#f5e642', borderTopColor: 'transparent' }} />
              </div>
            ) : error || !src ? (
              <div className="aspect-video flex items-center justify-center">
                <p className="text-text-muted text-sm">
                  {error || 'Stream is offline'}
                </p>
              </div>
            ) : (
              <Player.Root src={src} autoPlay lowLatency>
                <Player.Container style={{ width: '100%', aspectRatio: '16/9', position: 'relative', backgroundColor: 'black' }}>
                  <Player.Video style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  <Player.Controls
                    style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      padding: '12px 16px',
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}
                  >
                    <Player.MuteTrigger style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white', fontSize: 16 }}>
                      <Player.VolumeIndicator asChild matcher={false}><span>🔇</span></Player.VolumeIndicator>
                      <Player.VolumeIndicator asChild matcher={true}><span>🔊</span></Player.VolumeIndicator>
                    </Player.MuteTrigger>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                      <span style={{ color: 'white', fontSize: 12 }}>LIVE</span>
                    </div>
                    <Player.FullscreenTrigger style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white' }}>
                      <Player.FullscreenIndicator asChild matcher={false}><span>⛶</span></Player.FullscreenIndicator>
                      <Player.FullscreenIndicator asChild><span>✕</span></Player.FullscreenIndicator>
                    </Player.FullscreenTrigger>
                  </Player.Controls>
                </Player.Container>
              </Player.Root>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}