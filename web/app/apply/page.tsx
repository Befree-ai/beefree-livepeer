'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePrivy } from '@privy-io/react-auth'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'

const GENRES = [
  'Bollywood', 'Indie', 'Classical', 'Folk', 'Hip-Hop',
  'Electronic', 'Jazz', 'Rock', 'Pop', 'Devotional',
  'Ghazal', 'Sufi', 'Fusion', 'Instrumental', 'Other'
]

export default function ApplyPage() {
  const { user, authenticated } = useAuth()
  const { login, getAccessToken } = usePrivy()

  const [name, setName]                   = useState('')
  const [bio, setBio]                     = useState('')
  const [genre, setGenre]                 = useState<string[]>([])
  const [instagramHandle, setInstagram]   = useState('')
  const [sampleWorkUrl, setSampleWork]    = useState('')

  const [submitting, setSubmitting]       = useState(false)
  const [submitted, setSubmitted]         = useState(false)
  const [existingStatus, setExistingStatus] = useState<string | null>(null)
  const [error, setError]                 = useState<string | null>(null)
  const [checking, setChecking]           = useState(true)

  // Pre-fill name from user profile
  useEffect(() => {
    if (user) setName(user.name || '')
  }, [user])

  // Check if already applied
  useEffect(() => {
    if (!user) { setChecking(false); return }

    getAccessToken().then(token => {
      if (!token) { setChecking(false); return }
      fetch('/api/creator-application', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.data.applied) {
            setExistingStatus(data.data.status)
          }
        })
        .finally(() => setChecking(false))
    })
  }, [user])

  const toggleGenre = (g: string) => {
    setGenre(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    )
  }

  const handleSubmit = async () => {
    if (!authenticated) { login(); return }
    if (!name || !bio) { setError('Name and bio are required'); return }

    setSubmitting(true)
    setError(null)

    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Not authenticated')

      const res = await fetch('/api/creator-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, bio, genre, instagramHandle, sampleWorkUrl }),
      })

      const data = await res.json()
      if (!data.success && !data.data?.alreadyApplied) {
        throw new Error(data.error || 'Failed to submit')
      }

      setSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  // Already a creator
  if (user?.role === 'creator') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-text-primary font-medium mb-2">You are already a creator!</p>
            <a href="/dashboard" className="text-accent text-sm">Go to Dashboard →</a>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Loading check
  if (checking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
        </main>
        <Footer />
      </div>
    )
  }

  // Already applied
  if (existingStatus) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            {existingStatus === 'pending' && (
              <>
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⏳</span>
                </div>
                <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
                  Application under review
                </h2>
                <p className="text-text-muted text-sm">
                  We've received your application and will review it shortly.
                  Sign out and back in after approval to access your creator dashboard.
                </p>
              </>
            )}
            {existingStatus === 'rejected' && (
              <>
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✕</span>
                </div>
                <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
                  Application not approved
                </h2>
                <p className="text-text-muted text-sm">
                  Unfortunately your application wasn't approved this time.
                  Feel free to reach out to us directly.
                </p>
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Success after submit
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
              Application submitted!
            </h2>
            <p className="text-text-muted text-sm">
              We'll review your application and get back to you.
              Once approved, sign out and back in to access your creator dashboard.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 w-full">
        <div className="max-w-2xl mx-auto px-6 py-12">

          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold text-text-primary mb-2">
              Become a Creator
            </h1>
            <p className="text-text-muted text-sm">
              Share your music with fans and earn directly. No labels. No middlemen.
            </p>
          </div>

          <div className="flex flex-col gap-6">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Artist / Stage name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your artist name"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-elevated text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-border-hover transition-colors"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                About you <span className="text-red-400">*</span>
                <span className="text-text-muted font-normal ml-2">{bio.length}/500</span>
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, 500))}
                placeholder="Tell us about your music, your journey, what makes you unique..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-elevated text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-border-hover transition-colors resize-none"
              />
            </div>

            {/* Genre */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Genre
              </label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(g => (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className="text-xs px-3 py-1.5 rounded-full border transition-all"
                    style={{
                      borderColor: genre.includes(g) ? 'var(--color-accent)' : 'var(--color-border)',
                      background:  genre.includes(g) ? '#f5e64215' : 'var(--color-bg-elevated)',
                      color:       genre.includes(g) ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Instagram handle
                <span className="text-text-muted font-normal ml-2">so we can verify you're real</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-text-muted text-sm">@</span>
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={e => setInstagram(e.target.value.replace('@', ''))}
                  placeholder="yourhandle"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-bg-elevated text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-border-hover transition-colors"
                />
              </div>
            </div>

            {/* Sample work */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Sample work URL
                <span className="text-text-muted font-normal ml-2">YouTube, SoundCloud, Spotify etc.</span>
              </label>
              <input
                type="text"
                value={sampleWorkUrl}
                onChange={e => setSampleWork(e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-elevated text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-border-hover transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 px-4 py-3 rounded-lg">
                {error}
              </p>
            )}

            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!name || !bio}
            >
              Submit application
            </Button>

            <p className="text-xs text-text-muted">
              We review every application manually. You'll need to sign out and back in after approval.
            </p>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}