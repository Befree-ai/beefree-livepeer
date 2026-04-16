'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { IVideo } from '@/types'

export default function DashboardPage() {
  const { user } = useAuth()

  const [videoCount, setVideoCount] = useState(0)
  const [totalViews, setTotalViews] = useState(0)

  useEffect(() => {
    if (!user?._id) return

    fetch(`/api/videos?creator=${user._id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setVideoCount(data.data.total)
          setTotalViews(
            data.data.videos.reduce(
              (sum: number, v: IVideo) => sum + (v.viewCount || 0), 0
            )
          )
        }
      })
  }, [user?._id])

  const stats = [
    { label: 'Total videos',    value: videoCount            },
    { label: 'Total followers', value: user?.followersCount || 0 },
    { label: 'Total earnings',  value: '₹0'                  },
    { label: 'Total views',     value: totalViews            },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary mb-1">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-text-muted text-sm">
          Here&apos;s an overview of your channel
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-bg-surface p-5">
            <p className="font-display text-2xl font-semibold text-text-primary mb-1">
              {s.value}
            </p>
            <p className="text-xs text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Upload a video',    desc: 'Share music, performances, or exclusive content', href: '/dashboard/upload',     cta: 'Upload now'    },
            { title: 'Go live',           desc: 'Start a live stream to your fans',                href: '/dashboard/stream',     cta: 'Start stream'  },
            { title: 'View your profile', desc: 'See how your public profile looks to fans',       href: `/creator/${user?._id}`, cta: 'View profile'  },
          ].map((action) => (
            <div key={action.title} className="rounded-xl border border-border bg-bg-surface p-5 flex flex-col gap-3">
              <div>
                <p className="font-medium text-text-primary text-sm mb-1">{action.title}</p>
                <p className="text-xs text-text-muted leading-relaxed">{action.desc}</p>
              </div>
              <Link href={action.href}>
                <Button variant="secondary" size="sm">{action.cta}</Button>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Profile completion */}
      {!user?.bio && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
          <p className="text-sm font-medium text-accent mb-1">
            Complete your profile
          </p>
          <p className="text-xs text-text-muted mb-3">
            Add a bio and genres to help fans discover you
          </p>
          <Link href="/dashboard/profile">
            <Button variant="primary" size="sm">Edit profile</Button>
          </Link>
        </div>
      )}
    </div>
  )
}