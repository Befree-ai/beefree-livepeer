'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePrivy } from '@privy-io/react-auth'
import Button from '@/components/ui/Button'

const GENRES = [
  'Bollywood', 'Indie', 'Classical', 'Folk', 'Hip-Hop',
  'Electronic', 'Jazz', 'Rock', 'Pop', 'Devotional',
  'Ghazal', 'Sufi', 'Fusion', 'Instrumental', 'Other'
]

export default function EditProfilePage() {
  const { user, syncUser } = useAuth()
  const { getAccessToken }  = usePrivy()

  const [name, setName]         = useState('')
  const [bio, setBio]           = useState('')
  const [genre, setGenre]       = useState<string[]>([])
  const [instagram, setInstagram] = useState('')
  const [twitter, setTwitter]   = useState('')
  const [youtube, setYoutube]   = useState('')

  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Pre-fill form with existing user data
  useEffect(() => {
    if (!user) return
    setName(user.name || '')
    setBio(user.bio || '')
    // genre and socialLinks are creator-only fields
    // cast to any to access them
    const u = user as any
    setGenre(u.genre || [])
    setInstagram(u.socialLinks?.instagram || '')
    setTwitter(u.socialLinks?.twitter || '')
    setYoutube(u.socialLinks?.youtube || '')
  }, [user])

  const toggleGenre = (g: string) => {
    setGenre((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Not authenticated')

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          bio,
          genre,
          socialLinks: { instagram, twitter, youtube },
        }),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to save')

      await syncUser() // refresh user in context
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary mb-1">
          Edit profile
        </h1>
        <p className="text-text-muted text-sm">
          Help fans discover you
        </p>
      </div>

      <div className="flex flex-col gap-6">

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Display name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your artist name"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-elevated text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-border-hover transition-colors"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Bio
            <span className="text-text-muted font-normal ml-2">
              {bio.length}/500
            </span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 500))}
            placeholder="Tell fans about yourself..."
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-elevated text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-border-hover transition-colors resize-none"
          />
        </div>

        {/* Genre */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            Genre
            <span className="text-text-muted font-normal ml-2">
              Select all that apply
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => toggleGenre(g)}
                className="text-xs px-3 py-1.5 rounded-full border transition-all"
                style={{
                  borderColor: genre.includes(g)
                    ? 'var(--color-accent, #f5e642)'
                    : 'var(--color-border, #1f1f1f)',
                  background: genre.includes(g)
                    ? '#f5e64215'
                    : 'var(--color-bg-elevated, #1a1a1a)',
                  color: genre.includes(g)
                    ? 'var(--color-accent, #f5e642)'
                    : 'var(--color-text-secondary, #a0a0a0)',
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Social links */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            Social links
          </label>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Instagram', value: instagram, set: setInstagram, placeholder: 'instagram.com/yourhandle' },
              { label: 'Twitter / X', value: twitter, set: setTwitter, placeholder: 'x.com/yourhandle' },
              { label: 'YouTube', value: youtube, set: setYoutube, placeholder: 'youtube.com/@yourchannel' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-xs text-text-muted w-20 flex-shrink-0">
                  {s.label}
                </span>
                <input
                  type="text"
                  value={s.value}
                  onChange={(e) => s.set(e.target.value)}
                  placeholder={s.placeholder}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-bg-elevated text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-border-hover transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 px-4 py-3 rounded-lg">
            {error}
          </p>
        )}

        {/* Save */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            loading={saving}
          >
            Save changes
          </Button>
          {saved && (
            <p className="text-sm text-green-400">✓ Saved!</p>
          )}
        </div>

      </div>
    </div>
  )
}