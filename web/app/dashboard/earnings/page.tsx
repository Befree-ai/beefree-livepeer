'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePrivy } from '@privy-io/react-auth'
import FadeUp from '@/components/ui/FadeUp'

interface EarningsData {
  totalEarnings: number
  activeSubscribers: number
  monthlyRevenue: number
  recentSubscriptions: {
    _id: string
    fanName: string
    amount: number
    status: string
    createdAt: string
    validUntil: string
  }[]
}

export default function EarningsPage() {
  const { user } = useAuth()
  const { getAccessToken } = usePrivy()
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?._id) return
    getAccessToken().then(async token => {
      if (!token) return
      const res = await fetch('/api/earnings', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) setData(json.data)
      setLoading(false)
    })
  }, [user?._id])

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <div className="h-8 rounded w-32 mb-2 animate-pulse" style={{ background: 'var(--color-bg-elevated)' }} />
          <div className="h-4 rounded w-48 animate-pulse" style={{ background: 'var(--color-bg-elevated)' }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse"
              style={{ background: 'var(--color-bg-surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="h-8 rounded w-24 mb-2" style={{ background: 'var(--color-bg-elevated)' }} />
              <div className="h-3 rounded w-32" style={{ background: 'var(--color-bg-elevated)' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const stats = [
    {
      label: 'Active subscribers',
      value: data?.activeSubscribers || 0,
      accent: false,
      icon: '👥',
    },
    {
      label: 'Total earned',
      value: `₹${Math.round((data?.totalEarnings || 0) / 100)}`,
      accent: true,
      icon: '💰',
    },
    {
      label: 'This month',
      value: `₹${Math.round((data?.monthlyRevenue || 0) / 100)}`,
      accent: false,
      icon: '📅',
    },
  ]

  return (
    <div>
      <FadeUp>
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest mb-2 uppercase"
            style={{ color: 'var(--color-accent)' }}>
            Earnings
          </p>
          <h1 className="text-3xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            Your revenue
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Earnings from fan subscriptions
          </p>
        </div>
      </FadeUp>

      {/* Stats */}
      <FadeUp delay={0.05}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {stats.map(s => (
            <div key={s.label} className="rounded-2xl p-5"
              style={{
                background: s.accent ? 'rgba(232,184,75,0.06)' : 'var(--color-bg-surface)',
                border: s.accent ? '1px solid rgba(232,184,75,0.2)' : '1px solid rgba(255,255,255,0.06)',
              }}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-2xl font-bold mb-1"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: s.accent ? 'var(--color-accent)' : 'var(--color-text-primary)',
                }}>
                {s.value}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </FadeUp>

      {/* Recent subscribers */}
      <FadeUp delay={0.1}>
        <h2 className="font-bold text-base mb-4"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
          Recent subscribers
        </h2>

        {!data?.recentSubscriptions?.length ? (
          <div className="text-center py-20 rounded-2xl border border-dashed"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
              No subscribers yet
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Share your profile to get your first subscriber
            </p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Fan', 'Amount', 'Status', 'Valid Until', 'Date'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold px-4 py-3"
                      style={{ color: 'var(--color-text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentSubscriptions.map((sub, i) => (
                  <tr key={sub._id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    }}>
                    <td className="px-4 py-3 font-medium"
                      style={{ color: 'var(--color-text-primary)' }}>
                      {sub.fanName || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold"
                      style={{ color: 'var(--color-accent)' }}>
                      ₹{Math.round(sub.amount / 100)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{
                          background: sub.status === 'active' ? 'rgba(29,158,117,0.1)' : 'rgba(255,255,255,0.04)',
                          color: sub.status === 'active' ? '#1D9E75' : 'var(--color-text-muted)',
                        }}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(sub.validUntil).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(sub.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FadeUp>
    </div>
  )
}
