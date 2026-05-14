'use client'

import { useState, useRef } from 'react'
import * as tus from 'tus-js-client'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { usePrivy } from '@privy-io/react-auth'
import FadeUp from '@/components/ui/FadeUp'

type UploadStatus = 'idle' | 'creating' | 'uploading' | 'processing' | 'done' | 'error'

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  color: 'var(--color-text-primary)',
  fontSize: '14px',
  outline: 'none',
}

export default function UploadPage() {
  const { user } = useAuth()
  const { getAccessToken } = usePrivy()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [access, setAccess] = useState<'free' | 'premium'>('free')
  const [tags, setTags] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)

  const uploadRef = useRef<tus.Upload | null>(null)
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title, description, access,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to create video')

      const { tusEndpoint, video } = data.data
      setVideoId(video._id)
      setStatus('uploading')

      const upload = new tus.Upload(file, {
        endpoint: tusEndpoint,
        retryDelays: [0, 3000, 5000, 10000],
        metadata: { filename: file.name, filetype: file.type },
        onProgress: (uploaded: number, total: number) => {
          setProgress(Math.round((uploaded / total) * 100))
        },
        onSuccess: () => { setStatus('done'); setProgress(100) },
        onError: (err: Error) => { setError('Upload failed: ' + err.message); setStatus('error') },
      })

      uploadRef.current = upload
      upload.start()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStatus('error')
    }
  }

  const handleReset = () => {
    setStatus('idle'); setProgress(0); setFile(null)
    setTitle(''); setDescription(''); setTags('')
    setAccess('free'); setVideoId(null); setError(null)
  }

  const isUploading = status === 'uploading' || status === 'creating'

  return (
    <div className="max-w-2xl">
      <FadeUp>
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest mb-2 uppercase"
            style={{ color: 'var(--color-accent)' }}>
            Upload
          </p>
          <h1 className="text-3xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            Upload video
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Share your music with your fans
          </p>
        </div>
      </FadeUp>

      {/* Done state */}
      {status === 'done' && (
        <FadeUp>
          <div className="rounded-2xl p-6 mb-6"
            style={{ background: 'rgba(29,158,117,0.06)', border: '1px solid rgba(29,158,117,0.2)' }}>
            <p className="font-bold mb-1" style={{ color: '#1D9E75' }}>Upload complete! 🎉</p>
            <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
              Your video is processing. It will be ready to watch in 1–3 minutes.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleReset}
                className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'var(--color-accent)', color: '#000', border: 'none', cursor: 'pointer' }}>
                Upload another
              </button>
              {videoId && (
                <Link href={`/video/${videoId}`}>
                  <button className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                    View video →
                  </button>
                </Link>
              )}
              <Link href="/dashboard/videos">
                <button className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  My videos
                </button>
              </Link>
            </div>
          </div>
        </FadeUp>
      )}

      {status !== 'done' && (
        <FadeUp delay={0.05}>
          <div className="flex flex-col gap-6">

            {/* File picker */}
            <div>
              <label className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--color-text-primary)' }}>
                Video file
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl p-8 text-center cursor-pointer transition-all"
                style={{
                  border: '2px dashed rgba(255,255,255,0.08)',
                  background: file ? 'rgba(232,184,75,0.04)' : 'rgba(255,255,255,0.015)',
                  borderColor: file ? 'rgba(232,184,75,0.3)' : 'rgba(255,255,255,0.08)',
                }}
              >
                {file ? (
                  <div>
                    <div className="text-3xl mb-2">🎬</div>
                    <p className="text-sm font-semibold mb-1"
                      style={{ color: 'var(--color-text-primary)' }}>
                      {file.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl mb-3">📁</div>
                    <p className="text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text-secondary)' }}>
                      Click to select a video file
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      MP4, MOV, AVI — up to 10GB
                    </p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
                onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--color-text-primary)' }}>
                Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Live at Pune — Acoustic Set"
                disabled={isUploading} style={inputStyle} />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--color-text-primary)' }}>
                Description
              </label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Tell fans what this video is about..."
                rows={3} disabled={isUploading} style={{ ...inputStyle, resize: 'none' }} />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--color-text-primary)' }}>
                Tags
              </label>
              <input type="text" value={tags} onChange={e => setTags(e.target.value)}
                placeholder="bollywood, acoustic, live (comma separated)"
                disabled={isUploading} style={inputStyle} />
            </div>

            {/* Access */}
            <div>
              <label className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--color-text-primary)' }}>
                Access
              </label>
              <div className="flex gap-3">
                {(['free', 'premium'] as const).map(opt => (
                  <button key={opt} onClick={() => setAccess(opt)} disabled={isUploading}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      borderWidth: '1px', borderStyle: 'solid',
                      borderColor: access === opt ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)',
                      background: access === opt ? 'rgba(232,184,75,0.08)' : 'transparent',
                      color: access === opt ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      fontWeight: access === opt ? 600 : 400,
                    }}>
                    {opt === 'free' ? '🌍 Free' : '🔒 Premium'}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                {access === 'premium'
                  ? 'Only subscribers can watch this video'
                  : 'Anyone can watch this video for free'}
              </p>
            </div>

            {/* Progress bar */}
            {isUploading && (
              <div>
                <div className="flex justify-between text-xs mb-1.5"
                  style={{ color: 'var(--color-text-muted)' }}>
                  <span>{status === 'creating' ? 'Preparing...' : `Uploading ${progress}%`}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, background: 'var(--color-accent)' }} />
                </div>
              </div>
            )}

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {isUploading ? (
                <button onClick={() => { uploadRef.current?.abort(); setStatus('idle'); setProgress(0) }}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer' }}>
                  Cancel upload
                </button>
              ) : (
                <button onClick={handleUpload} disabled={!file || !title}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: !file || !title ? 'rgba(232,184,75,0.3)' : 'var(--color-accent)',
                    color: '#000', border: 'none',
                    cursor: !file || !title ? 'not-allowed' : 'pointer',
                  }}>
                  Upload video →
                </button>
              )}
            </div>

          </div>
        </FadeUp>
      )}
    </div>
  )
}
