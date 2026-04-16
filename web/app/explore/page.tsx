'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Badge from '@/components/ui/Badge'
import { ICreator } from '@/types'

function CreatorCard({ creator }: { creator: ICreator }) {
  return (
    <Link
      href={`/creator/${creator._id}`}
      className="group block rounded-xl border border-border bg-bg-surface p-6 hover:border-border-hover transition-all"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0">
          {creator.avatar ? (
            <img
              src={creator.avatar}
              alt={creator.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-xl font-semibold text-text-secondary">
              {creator.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-text-primary truncate">
              {creator.name || 'Unknown Artist'}
            </p>
            {creator.isVerified && (
              <Badge variant="verified">✓</Badge>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {creator.followersCount} followers
          </p>
        </div>
      </div>

      {creator.bio && (
        <p className="text-sm text-text-secondary line-clamp-2 mb-4">
          {creator.bio}
        </p>
      )}

      {creator.genre && creator.genre.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {creator.genre.slice(0, 3).map((g) => (
            <span
              key={g}
              className="text-xs px-2 py-0.5 rounded-full border border-border text-text-muted"
            >
              {g}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-accent group-hover:underline">
        View profile →
      </p>
    </Link>
  )
}

function CreatorSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-bg-elevated" />
        <div className="flex-1">
          <div className="h-4 bg-bg-elevated rounded w-3/4 mb-2" />
          <div className="h-3 bg-bg-elevated rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-bg-elevated rounded w-full mb-2" />
      <div className="h-3 bg-bg-elevated rounded w-2/3" />
    </div>
  )
}

export default function ExplorePage() {
  const [creators, setCreators] = useState<ICreator[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

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
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16 w-full">
        <div className="max-w-6xl mx-auto px-6 py-12">

          <div className="mb-10">
            <h1 className="font-display text-4xl font-semibold text-text-primary mb-2">
              Explore
            </h1>
            <p className="text-text-secondary">
              Discover independent Indian artists
            </p>
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-6">{error}</p>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CreatorSkeleton key={i} />
              ))}
            </div>
          ) : creators.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-text-muted text-sm">
                No creators yet. Be the first!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((creator) => (
                <CreatorCard key={creator._id} creator={creator} />
              ))}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  )
}