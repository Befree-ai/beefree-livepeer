'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'

export default function Navbar() {
  const { ready, authenticated, login, logout, user } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-bg-primary/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="font-display text-xl font-semibold text-text-primary hover:text-accent transition-colors"
        >
          BeeFree
        </Link>

        {/* Nav links — only when logged in */}
        {authenticated && (
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/explore"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Explore
            </Link>
            {user?.role === 'creator' && (
              <Link
                href="/dashboard"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Dashboard
              </Link>
            )}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {!ready ? (
            // Loading state
            <div className="w-8 h-8 rounded-full bg-bg-elevated animate-pulse" />
          ) : authenticated ? (
            <>
              {/* User avatar */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <span className="text-xs font-medium text-accent">
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <span className="hidden md:block text-sm text-text-secondary">
                  {user?.name || 'User'}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={login}
              >
                Sign in
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={login}
              >
                Get started
              </Button>
            </>
          )}
        </div>

      </div>
    </header>
  )
}