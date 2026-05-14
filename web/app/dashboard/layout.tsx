'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

const sidebarLinks = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: '/dashboard/upload',
    label: 'Upload',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      </svg>
    ),
  },
  {
    href: '/dashboard/videos',
    label: 'My Videos',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    href: '/dashboard/stream',
    label: 'Go Live',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="2" />
        <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
      </svg>
    ),
  },
  {
    href: '/dashboard/earnings',
    label: 'Earnings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: '/dashboard/profile',
    label: 'Edit Profile',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

const mobileLinks = [
  { href: '/dashboard', label: 'Home', icon: '⌂' },
  { href: '/dashboard/upload', label: 'Upload', icon: '↑' },
  { href: '/dashboard/videos', label: 'Videos', icon: '▶' },
  { href: '/dashboard/stream', label: 'Live', icon: '●' },
  { href: '/dashboard/profile', label: 'Profile', icon: '○' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { ready, authenticated, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!ready) return
    if (!authenticated) { router.push('/'); return }
    if (user && user.role !== 'creator') router.push('/explore')
  }, [ready, authenticated, user, router])

  if (!ready || !authenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-bg-primary)' }}>
        <div
          className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-primary)' }}>
      <Navbar />

      <div className="flex-1 pt-14 flex">

        {/* Desktop sidebar */}
        <aside
          className="hidden md:flex flex-col w-56 flex-shrink-0 px-3 py-6"
          style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
        >
          {/* Creator info */}
          <div className="px-3 mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  background: 'rgba(232,184,75,0.12)',
                  color: 'var(--color-accent)',
                  border: '1px solid rgba(232,184,75,0.2)',
                }}
              >
                {user.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {user.name?.split(' ')[0]}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Creator
                </p>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-0.5 flex-1">
            {sidebarLinks.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                  style={{
                    color: isActive
                      ? 'var(--color-accent)'
                      : 'var(--color-text-muted)',
                    background: isActive
                      ? 'rgba(232,184,75,0.08)'
                      : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  <span
                    style={{
                      color: isActive
                        ? 'var(--color-accent)'
                        : 'var(--color-text-muted)',
                    }}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                  {item.href === '/dashboard/stream' && (
                    <span
                      className="ml-auto text-xs font-semibold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(232,52,138,0.12)',
                        color: 'var(--color-pink)',
                        fontSize: '9px',
                      }}
                    >
                      LIVE
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Bottom — view profile link */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Link
              href={`/creator/${user._id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View public profile
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 md:px-8 py-6 pb-24 md:pb-6 max-w-5xl w-full">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2"
        style={{
          background: 'rgba(8,8,8,0.95)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {mobileLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all"
            style={{
              color: pathname === item.href
                ? 'var(--color-accent)'
                : 'var(--color-text-muted)',
            }}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
