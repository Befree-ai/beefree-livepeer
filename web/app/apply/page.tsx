'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePrivy } from '@privy-io/react-auth'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import FadeUp from '@/components/ui/FadeUp'

const GENRES = [
  'Bollywood', 'Indie', 'Classical', 'Folk', 'Hip-Hop',
  'Electronic', 'Jazz', 'Rock', 'Pop', 'Devotional',
  'Ghazal', 'Sufi', 'Fusion', 'Instrumental', 'Punjabi', 'Other',
]

// ── Reusable field wrapper ────────────────────────────────────────────────────
function Field({
  label,
  required,
  hint,
  children,
  count,
  max,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
  count?: number
  max?: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
          {hint && (
            <span className="font-normal ml-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {hint}
            </span>
          )}
        </label>
        {count !== undefined && max && (
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {count}/{max}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

// ── Input styles ──────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  color: 'var(--color-text-primary)',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
}

// ── Status screens ────────────────────────────────────────────────────────────
function StatusScreen({
  icon,
  title,
  desc,
  color = 'accent',
}: {
  icon: string
  title: string
  desc: string
  color?: 'accent' | 'red' | 'pink'
}) {
  const colorMap = {
    accent: { bg: 'rgba(232,184,75,0.08)', border: 'rgba(232,184,75,0.2)', text: 'var(--color-accent)' },
    red:    { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  text: '#ef4444' },
    pink:   { bg: 'rgba(232,52,138,0.08)', border: 'rgba(232,52,138,0.2)', text: 'var(--color-pink)' },
  }
  const c = colorMap[color]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-primary)' }}>
      <Navbar />
      <main className="flex-1 pt-16 flex items-center justify-center px-6">
        <FadeUp>
          <div className="text-center max-w-md">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl"
              style={{ background: c.bg, border: `1px solid ${c.border}` }}
            >
              {icon}
            </div>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
            >
              {title}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {desc}
            </p>
          </div>
        </FadeUp>
      </main>
      <Footer />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ApplyPage() {
  const { user, authenticated, isLoading } = useAuth()
  const { login, getAccessToken } = usePrivy()

  const [name, setName]               = useState('')
  const [bio, setBio]                 = useState('')
  const [genre, setGenre]             = useState<string[]>([])
  const [instagramHandle, setInstagram] = useState('')
  const [sampleWorkUrl, setSampleWork]  = useState('')

  const [submitting, setSubmitting]     = useState(false)
  const [submitted, setSubmitted]       = useState(false)
  const [existingStatus, setExistingStatus] = useState<string | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const [checking, setChecking]         = useState(true)

  useEffect(() => {
    if (user) setName(user.name || '')
  }, [user])

  useEffect(() => {
    if (!authenticated) { setChecking(false); return }
    if (!user) return

    getAccessToken().then(token => {
      if (!token) { setChecking(false); return }
      fetch('/api/creator-application', {
        headers: { Authorization: `Bearer ${token}` },
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
    setGenre(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  const handleSubmit = async () => {
    if (!authenticated) { login(); return }
    if (!name || !bio) { setError('Artist name and bio are required'); return }

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
      <StatusScreen
        icon="✓"
        title="You're already a creator!"
        desc="Head to your dashboard to upload content and manage your profile."
        color="accent"
      />
    )
  }

  // Loading
  if (isLoading || checking) {
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

  // Already applied — pending
  if (existingStatus === 'pending') {
    return (
      <StatusScreen
        icon="⏳"
        title="Application under review"
        desc="We've received your application and will review it shortly. Sign out and back in after approval to access your creator dashboard."
        color="pink"
      />
    )
  }

  // Already applied — rejected
  if (existingStatus === 'rejected') {
    return (
      <StatusScreen
        icon="✕"
        title="Application not approved"
        desc="Unfortunately your application wasn't approved this time. Feel free to reach out to us directly."
        color="red"
      />
    )
  }

  // Success
  if (submitted) {
    return (
      <StatusScreen
        icon="🎉"
        title="Application submitted!"
        desc="We'll review your application and get back to you. Once approved, sign out and back in to access your creator dashboard."
        color="accent"
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-primary)' }}>
      <Navbar />
      <main className="flex-1 pt-16 w-full">
        <div className="max-w-2xl mx-auto px-6 py-12">

          {/* Header */}
          <FadeUp>
            <div className="mb-10">
              <p
                className="text-xs font-semibold tracking-widest mb-3 uppercase"
                style={{ color: 'var(--color-accent)' }}
              >
                Early access
              </p>
              <h1
                className="text-4xl font-bold mb-3"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
              >
                Become a Creator
              </h1>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Share your music with fans and earn directly.
                No labels. No middlemen. Just you and your audience.
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="flex flex-col gap-6">

              {/* Name */}
              <Field label="Artist / Stage name" required>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your artist name"
                  style={inputStyle}
                />
              </Field>

              {/* Bio */}
              <Field
                label="About you"
                required
                count={bio.length}
                max={500}
              >
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 500))}
                  placeholder="Tell us about your music, your journey, what makes you unique..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </Field>

              {/* Genre */}
              <Field label="Genre">
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(g => {
                    const selected = genre.includes(g)
                    return (
                      <button
                        key={g}
                        onClick={() => toggleGenre(g)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all"
                        style={{
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: selected ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)',
                          background: selected ? 'rgba(232,184,75,0.1)' : 'transparent',
                          color: selected ? 'var(--color-accent)' : 'var(--color-text-muted)',
                          cursor: 'pointer',
                          fontWeight: selected ? 600 : 400,
                        }}
                      >
                        {g}
                      </button>
                    )
                  })}
                </div>
              </Field>

              {/* Instagram */}
              <Field label="Instagram handle" hint="so we can verify you're real">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    @
                  </span>
                  <input
                    type="text"
                    value={instagramHandle}
                    onChange={e => setInstagram(e.target.value.replace('@', ''))}
                    placeholder="yourhandle"
                    style={{ ...inputStyle }}
                  />
                </div>
              </Field>

              {/* Sample work */}
              <Field label="Sample work URL" hint="YouTube, SoundCloud, Spotify etc.">
                <input
                  type="text"
                  value={sampleWorkUrl}
                  onChange={e => setSampleWork(e.target.value)}
                  placeholder="https://youtube.com/..."
                  style={inputStyle}
                />
              </Field>

              {/* Error */}
              {error && (
                <div
                  className="px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#ef4444',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !name || !bio}
                className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: submitting || !name || !bio
                    ? 'rgba(232,184,75,0.3)'
                    : 'var(--color-accent)',
                  color: '#000',
                  border: 'none',
                  cursor: submitting || !name || !bio ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Submitting...' : 'Submit application →'}
              </button>

              <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                We review every application manually.
                You'll need to sign out and back in after approval.
              </p>

            </div>
          </FadeUp>
        </div>
      </main>
      <Footer />
    </div>
  )
}
