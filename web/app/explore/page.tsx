'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { ICreator } from '@/types'
import FadeUp from '@/components/ui/FadeUp'

// ── Creator Card ─────────────────────────────────────────────────────────────
function CreatorCard({ creator, index }: { creator: ICreator; index: number }) {
  const initial = creator.name?.charAt(0)?.toUpperCase() || '?'

  // Cycle through accent colors for avatar backgrounds
  const avatarColors = [
    { bg: 'rgba(232,184,75,0.12)', border: 'rgba(232,184,75,0.25)', color: 'var(--color-accent)' },
    { bg: 'rgba(232,52,138,0.12)', border: 'rgba(232,52,138,0.25)', color: 'var(--color-pink)' },
    { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', color: '#818cf8' },
    { bg: 'rgba(29,158,117,0.12)', border: 'rgba(29,158,117,0.25)', color: '#1D9E75' },
  ]
  const colorScheme = avatarColors[index % avatarColors.length]

  return (
    <FadeUp delay={index * 0.05}>
      <Link
        href={`/creator/${creator._id}`}
        className="group block rounded-2xl overflow-hidden transition-all hover:scale-[1.02]"
        style={{
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'var(--color-bg-surface)',
        }}
      >
        {/* Cover area */}
        <div
          className="h-24 relative"
          style={{
            background: `linear-gradient(135deg, ${colorScheme.bg.replace('0.12', '0.3')} 0%, rgba(8,8,8,0) 100%)`,
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          {/* Verified badge top right */}
          {creator.isVerified && (
            <div
              className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(232,184,75,0.12)',
                border: '1px solid rgba(232,184,75,0.25)',
                color: 'var(--color-accent)',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verified
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          {/* Avatar — pulled up over cover */}
          <div className="flex items-end justify-between -mt-7 mb-3">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold border-4 flex-shrink-0"
              style={{
                background: creator.avatar ? 'transparent' : colorScheme.bg,
                borderColor: 'var(--color-bg-surface)',
                color: colorScheme.color,
              }}
            >
              {creator.avatar ? (
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                initial
              )}
            </div>

            {/* Follower count pill */}
            <div
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'var(--color-text-muted)',
              }}
            >
              {creator.followersCount?.toLocaleString() || 0} followers
            </div>
          </div>

          {/* Name */}
          <p
            className="font-bold text-base mb-1 group-hover:text-accent transition-colors"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text-primary)',
            }}
          >
            {creator.name || 'Unknown Artist'}
          </p>

          {/* Bio */}
          {creator.bio && (
            <p
              className="text-xs leading-relaxed line-clamp-2 mb-3"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {creator.bio}
            </p>
          )}

          {/* Genre tags */}
          {creator.genre && creator.genre.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {creator.genre.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: colorScheme.bg,
                    border: `1px solid ${colorScheme.border}`,
                    color: colorScheme.color,
                  }}
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <div
            className="flex items-center justify-between pt-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span
              className="text-xs font-medium group-hover:gap-2 transition-all flex items-center gap-1"
              style={{ color: 'var(--color-accent)' }}
            >
              View profile
              <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </span>
            {creator.subscriptionPrice && (
              <span
                className="text-xs font-semibold"
                style={{ color: 'var(--color-text-muted)' }}
              >
                ₹{Math.round(creator.subscriptionPrice / 100)}/mo
              </span>
            )}
          </div>
        </div>
      </Link>
    </FadeUp>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function CreatorSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'var(--color-bg-surface)' }}
    >
      <div className="h-24" style={{ background: 'var(--color-bg-elevated)' }} />
      <div className="px-5 pb-5">
        <div className="flex items-end justify-between -mt-7 mb-3">
          <div className="w-14 h-14 rounded-xl" style={{ background: 'var(--color-bg-elevated)', border: '4px solid var(--color-bg-surface)' }} />
          <div className="h-5 w-20 rounded-full" style={{ background: 'var(--color-bg-elevated)' }} />
        </div>
        <div className="h-4 rounded w-2/3 mb-2" style={{ background: 'var(--color-bg-elevated)' }} />
        <div className="h-3 rounded w-full mb-1" style={{ background: 'var(--color-bg-elevated)' }} />
        <div className="h-3 rounded w-3/4 mb-4" style={{ background: 'var(--color-bg-elevated)' }} />
        <div className="flex gap-1.5 mb-4">
          {[1, 2].map(i => (
            <div key={i} className="h-5 w-16 rounded-full" style={{ background: 'var(--color-bg-elevated)' }} />
          ))}
        </div>
        <div className="h-px mb-3" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="h-3 rounded w-1/4" style={{ background: 'var(--color-bg-elevated)' }} />
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const [creators, setCreators] = useState<ICreator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/creators')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCreators(data.data.creators)
        else setError('Failed to load creators')
      })
      .catch(() => setError('Failed to load creators'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-primary)' }}>
      <Navbar />

      <main className="flex-1 pt-16 w-full">
        <div className="max-w-6xl mx-auto px-6 py-12">

          {/* Header */}
          <FadeUp>
            <div className="mb-12">
              <p
                className="text-xs font-semibold tracking-widest mb-3 uppercase"
                style={{ color: 'var(--color-accent)' }}
              >
                Discover
              </p>
              <h1
                className="text-4xl md:text-5xl font-bold mb-3"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
              >
                Independent Indian artists.
              </h1>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Support creators directly. Own their tokens. Be part of their journey.
              </p>
            </div>
          </FadeUp>

          {error && (
            <p className="text-red-400 text-sm mb-6">{error}</p>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <CreatorSkeleton key={i} />
              ))}
            </div>
          ) : creators.length === 0 ? (
            <div
              className="text-center py-32 rounded-2xl border border-dashed"
              style={{ borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <p
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
              >
                No creators yet.
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
                Be the first artist on BeeFree.
              </p>
              <Link href="/apply">
                <button
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: 'var(--color-accent)', color: '#000', border: 'none', cursor: 'pointer' }}
                >
                  Apply to join →
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {creators.map((creator, index) => (
                <CreatorCard key={creator._id} creator={creator} index={index} />
              ))}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  )
}
