'use client'

import { useState, useRef } from 'react'
import * as tus from 'tus-js-client'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { usePrivy } from '@privy-io/react-auth'
import Button from '@/components/ui/Button'

type UploadStatus = 'idle' | 'creating' | 'uploading' | 'processing' | 'done' | 'error'

export default function UploadPage() {
  const { user }           = useAuth()
  const { getAccessToken } = usePrivy()

  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [access, setAccess]           = useState<'free' | 'premium'>('free')
  const [tags, setTags]               = useState('')
  const [file, setFile]               = useState<File | null>(null)

  const [status, setStatus]       = useState<UploadStatus>('idle')
  const [progress, setProgress]   = useState(0)
  const [error, setError]         = useState<string | null>(null)
  const [playbackId, setPlaybackId] = useState<string | null>(null)
  const [videoId, setVideoId]     = useState<string | null>(null)

  const uploadRef   = useRef<tus.Upload | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    if (!file || !title) return
    setError(null)
    setStatus('creating')

    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Not authenticated')

      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          access,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to create video')

      const { tusEndpoint, video } = data.data
      setPlaybackId(video.playbackId)
      setVideoId(video._id)
      setStatus('uploading')

      const upload = new tus.Upload(file, {
        endpoint: tusEndpoint,
        retryDelays: [0, 3000, 5000, 10000],
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
        onProgress: (uploaded: number, total: number) => {
          setProgress(Math.round((uploaded / total) * 100))
        },
        onSuccess: () => {
          setStatus('done')
          setProgress(100)
        },
        onError: (err: Error) => {
          setError('Upload failed: ' + err.message)
          setStatus('error')
        },
      })

      uploadRef.current = upload
      upload.start()

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStatus('error')
    }
  }

  const handleCancel = () => {
    uploadRef.current?.abort()
    setStatus('idle')
    setProgress(0)
  }

  const handleReset = () => {
    setStatus('idle')
    setProgress(0)
    setFile(null)
    setTitle('')
    setDescription('')
    setTags('')
    setAccess('free')
    setPlaybackId(null)
    setVideoId(null)
    setError(null)
  }

  const isUploading = status === 'uploading' || status === 'creating'

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary mb-1">
          Upload video
        </h1>
        <p className="text-text-muted text-sm">
          Share your music with your fans
        </p>
      </div>

      {/* ── Done state ── */}
      {status === 'done' && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 mb-6">
          <p className="font-medium text-green-400 mb-1">Upload complete!</p>
          <p className="text-sm text-text-muted mb-4">
            Your video is processing. It will be ready to watch in 1-3 minutes.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button variant="primary" size="sm" onClick={handleReset}>
              Upload another
            </Button>
            {videoId && (
              <Link href={`/video/${videoId}`}>
                <Button variant="secondary" size="sm">
                  View video →
                </Button>
              </Link>
            )}
            <Link href="/dashboard/videos">
              <Button variant="ghost" size="sm">
                My videos
              </Button>
            </Link>
          </div>
        </div>
      )}

      {status !== 'done' && (
        <div className="flex flex-col gap-6">

          {/* File picker */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Video file
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-border-hover transition-colors"
            >
              {file ? (
                <div>
                  <p className="text-sm text-text-primary font-medium">{file.name}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-text-secondary mb-1">
                    Click to select a video file
                  </p>
                  <p className="text-xs text-text-muted">
                    MP4, MOV, AVI — up to 10GB
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Live at Pune — Acoustic Set"
              disabled={isUploading}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-elevated text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-border-hover disabled:opacity-50 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell fans what this video is about..."
              rows={3}
              disabled={isUploading}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-elevated text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-border-hover disabled:opacity-50 transition-colors resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="bollywood, acoustic, live (comma separated)"
              disabled={isUploading}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-elevated text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-border-hover disabled:opacity-50 transition-colors"
            />
          </div>

          {/* Access */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Access
            </label>
            <div className="flex gap-3">
              {(['free', 'premium'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAccess(opt)}
                  disabled={isUploading}
                  className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all disabled:opacity-50"
                  style={{
                    borderColor: access === opt ? 'var(--color-accent, #f5e642)' : 'var(--color-border, #1f1f1f)',
                    background:  access === opt ? '#f5e64215' : 'var(--color-bg-elevated, #1a1a1a)',
                    color:       access === opt ? 'var(--color-accent, #f5e642)' : 'var(--color-text-secondary, #a0a0a0)',
                  }}
                >
                  {opt === 'free' ? '🌍 Free' : '🔒 Premium'}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-2">
              {access === 'premium'
                ? 'Only subscribers can watch this video'
                : 'Anyone can watch this video for free'}
            </p>
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div>
              <div className="flex justify-between text-xs text-text-muted mb-1.5">
                <span>{status === 'creating' ? 'Creating...' : `Uploading ${progress}%`}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: 'var(--color-accent, #f5e642)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 px-4 py-3 rounded-lg">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {isUploading ? (
              <Button variant="danger" size="md" onClick={handleCancel}>
                Cancel upload
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleUpload}
                disabled={!file || !title}
                loading={isUploading}
              >
                Upload video
              </Button>
            )}
          </div>

        </div>
      )}
    </div>
  )
}