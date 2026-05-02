'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Badge from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'

interface FanProfile {
  _id: string
  name: string
  avatar: string
  role: string
  followingCount: number
  createdAt: string
}

interface FollowingCreator {
  _id: string
  name: string
  avatar: string
  followersCount: number
  isVerified: boolean
  genre: string[]
}

export default function FanProfilePage() {
  const params    = useParams()
  const id        = params?.id as string
  const { user }  = useAuth()

  const [profile, setProfile]               = useState<FanProfile | null>(null)
  const [followingCreators, setFollowing]   = useState<FollowingCreator[]>([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState<string | null>(null)

  const isOwnProfile = user?._id === id

  useEffect(() => {
    if (!id) return

    fetch(`/api/users/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setProfile(data.data.user)
          setFollowing(data.data.followingCreators)
        } else {
          setError('Profile not found')
        }
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 max-w-4xl mx-auto px-6 py-12 w-full">
          <div className="animate-pulse">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-bg-elevated" />
              <div>
                <div className="h-6 bg-bg-elevated rounded w-40 mb-2" />
                <div className="h-4 bg-bg-elevated rounded w-24" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <p className="text-text-muted">{error || 'Profile not found'}</p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16 w-full">
        <div className="max-w-4xl mx-auto px-6 py-12">

          {/* Profile header */}
          <div className="flex items-start gap-6 mb-10 pb-10 border-b border-border">
            <div className="w-20 h-20 rounded-full bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold text-text-secondary">
                  {profile.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="font-display text-2xl font-semibold text-text-primary">
                  {profile.name}
                </h1>
                {profile.role === 'creator' && (
                  <Badge variant="verified">Creator</Badge>
                )}
              </div>

              <p className="text-text-muted text-sm mb-1">
                Following {profile.followingCount} creators
              </p>

              <p className="text-text-muted text-xs">
                Joined {new Date(profile.createdAt).toLocaleDateString('en-IN', {
                  month: 'long', year: 'numeric'
                })}
              </p>

              {isOwnProfile && (
                <p className="text-xs text-accent mt-2">Your profile</p>
              )}
            </div>
          </div>

          {/* Following list */}
          <div>
            <h2 className="font-display text-xl font-semibold text-text-primary mb-6">
              {isOwnProfile ? 'Creators you follow' : 'Following'}
            </h2>

            {followingCreators.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <p className="text-text-muted text-sm">
                  {isOwnProfile
                    ? "You're not following any creators yet"
                    : "Not following any creators yet"}
                </p>
                {isOwnProfile && (
                  <Link
                    href="/explore"
                    className="text-accent text-sm mt-2 inline-block hover:underline"
                  >
                    Discover creators →
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {followingCreators.map(creator => (
                  <Link
                    key={creator._id}
                    href={`/creator/${creator._id}`}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border bg-bg-surface hover:border-border-hover transition-all"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0">
                      {creator.avatar ? (
                        <img
                          src={creator.avatar}
                          alt={creator.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-text-secondary">
                          {creator.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-text-primary text-sm">
                          {creator.name}
                        </p>
                        {creator.isVerified && (
                          <Badge variant="verified">Verified</Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">
                        {creator.followersCount} followers
                        {creator.genre?.length > 0 && (
                          <> · {creator.genre.slice(0, 2).join(', ')}</>
                        )}
                      </p>
                    </div>

                    <span className="text-text-muted text-sm">→</span>
                  </Link>
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