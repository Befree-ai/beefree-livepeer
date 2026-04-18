'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

const sidebarLinks = [
  { href: '/dashboard',          label: 'Overview'      },
  { href: '/dashboard/upload',   label: 'Upload'        },
  { href: '/dashboard/videos',   label: 'My Videos'     },
  { href: '/dashboard/stream',   label: 'Go Live'       },
  { href: '/dashboard/profile',  label: 'Edit Profile'  },
  { href: '/dashboard/earnings', label: 'Earnings'      },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { ready, authenticated, user } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!ready) return
    if (!authenticated) { router.push('/'); return }
    if (user && user.role !== 'creator') router.push('/explore')
  }, [ready, authenticated, user, router])

  if (!ready || !authenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 pt-14 flex">

        {/* Desktop sidebar */}
        <aside
          className="hidden md:flex flex-col w-56 border-r border-border px-4 py-8 flex-shrink-0"
        >
          <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-4 px-2">
            Dashboard
          </p>
          <nav className="flex flex-col gap-1">
            {sidebarLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm px-3 py-2 rounded-lg transition-all"
                style={{
                  color: pathname === item.href
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-secondary)',
                  background: pathname === item.href
                    ? 'var(--color-bg-elevated)'
                    : 'transparent',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
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
          background: 'rgba(10,10,10,0.95)',
          borderTop: '1px solid var(--color-border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {[
          { href: '/dashboard',         label: 'Home',    icon: '⌂' },
          { href: '/dashboard/upload',  label: 'Upload',  icon: '↑' },
          { href: '/dashboard/videos',  label: 'Videos',  icon: '▶' },
          { href: '/dashboard/stream',  label: 'Live',    icon: '●' },
          { href: '/dashboard/profile', label: 'Profile', icon: '○' },
        ].map((item) => (
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