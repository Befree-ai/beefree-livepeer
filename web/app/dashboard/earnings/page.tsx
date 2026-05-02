'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePrivy } from '@privy-io/react-auth'

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
  const { user }           = useAuth()
  const { getAccessToken } = usePrivy()

  const [data, setData]       = useState<EarningsData | null>(null)
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
        <h1 className="font-display text-3xl font-semibold text-text-primary mb-8">
          Earnings
        </h1>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-bg-surface p-5 animate-pulse">
              <div className="h-8 bg-bg-elevated rounded w-24 mb-2" />
              <div className="h-3 bg-bg-elevated rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary mb-1">
          Earnings
        </h1>
        <p className="text-text-muted text-sm">
          Your revenue from fan subscriptions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {[
          {
            label: 'Active subscribers',
            value: data?.activeSubscribers || 0,
            prefix: '',
          },
          {
            label: 'Total earned',
            value: `₹${Math.round((data?.totalEarnings || 0) / 100)}`,
            prefix: '',
          },
          {
            label: 'This month',
            value: `₹${Math.round((data?.monthlyRevenue || 0) / 100)}`,
            prefix: '',
          },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-bg-surface p-5">
            <p className="font-display text-2xl font-semibold text-text-primary mb-1">
              {s.value}
            </p>
            <p className="text-xs text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent subscriptions */}
      <div>
        <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
          Recent subscribers
        </h2>

        {!data?.recentSubscriptions?.length ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl">
            <p className="text-text-muted text-sm">No subscribers yet</p>
            <p className="text-text-muted text-xs mt-1">
              Share your profile to get your first subscriber
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Fan', 'Amount', 'Status', 'Valid Until', 'Date'].map(h => (
                    <th key={h}
                      className="text-left text-xs text-text-muted font-medium px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentSubscriptions.map((sub, i) => (
                  <tr key={sub._id}
                    className="border-b border-border last:border-0"
                    style={{
                      background: i % 2 === 0
                        ? 'transparent'
                        : 'var(--color-bg-elevated)'
                    }}
                  >
                    <td className="px-4 py-3 text-text-primary">
                      {sub.fanName || '—'}
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      ₹{Math.round(sub.amount / 100)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full"
                        style={{
                          background: sub.status === 'active'
                            ? '#1D9E7515' : 'var(--color-bg-elevated)',
                          color: sub.status === 'active'
                            ? '#1D9E75' : 'var(--color-text-muted)',
                        }}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {new Date(sub.validUntil).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {new Date(sub.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}