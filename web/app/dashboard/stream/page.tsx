"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePrivy } from "@privy-io/react-auth";
import * as Broadcast from "@livepeer/react/broadcast";
import { getIngest } from "@livepeer/react/external";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

type StreamStatus = "idle" | "creating" | "ready" | "live" | "error";

interface StreamData {
  streamId: string;
  streamKey: string;
  playbackId: string;
  rtmpIngestUrl: string;
  whipUrl: string;
}

export default function GoLivePage() {
  const { user } = useAuth();
  const { getAccessToken } = usePrivy();

  const [status, setStatus] = useState<StreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<StreamData | null>(null);
  const [title, setTitle] = useState("");
  const [access, setAccess] = useState<"free" | "premium">("free");
  const [useBrowser, setUseBrowser] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  // Stop camera/mic when leaving the page
  useEffect(() => {
    return () => {
      // On unmount — stop all media tracks
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          stream.getTracks().forEach((track) => track.stop());
        })
        .catch(() => {});

      // Also stop any existing streams in DOM
      document.querySelectorAll("video").forEach((video) => {
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          video.srcObject = null;
        }
      });
    };
  }, []);

  const handleCreateStream = async () => {
    if (!title) return;
    setError(null);
    setStatus("creating");

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/streams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, access }),
      });

      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Failed to create stream");

      setStream(data.data);
      setStatus("ready");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create stream");
      setStatus("error");
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary mb-1">
          Go Live
        </h1>
        <p className="text-text-muted text-sm">
          Stream directly to your fans in real time
        </p>
      </div>

      {/* Step 1 — Create stream */}
      {status === "idle" || status === "creating" || status === "error" ? (
        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Stream title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Live Q&A with fans"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-elevated text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-border-hover transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Access
            </label>
            <div className="flex gap-3">
              {(["free", "premium"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAccess(opt)}
                  className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all"
                  style={{
                    borderColor:
                      access === opt
                        ? "var(--color-accent, #f5e642)"
                        : "var(--color-border, #1f1f1f)",
                    background:
                      access === opt
                        ? "#f5e64215"
                        : "var(--color-bg-elevated, #1a1a1a)",
                    color:
                      access === opt
                        ? "var(--color-accent, #f5e642)"
                        : "var(--color-text-secondary, #a0a0a0)",
                  }}
                >
                  {opt === "free" ? "🌍 Free" : "🔒 Premium"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              How will you stream?
            </label>
            <div className="flex gap-3">
              {[
                { key: true, label: "🌐 Browser (recommended)" },
                { key: false, label: "🎬 OBS / External software" },
              ].map((opt) => (
                <button
                  key={String(opt.key)}
                  onClick={() => setUseBrowser(opt.key)}
                  className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all"
                  style={{
                    borderColor:
                      useBrowser === opt.key
                        ? "var(--color-accent, #f5e642)"
                        : "var(--color-border, #1f1f1f)",
                    background:
                      useBrowser === opt.key
                        ? "#f5e64215"
                        : "var(--color-bg-elevated, #1a1a1a)",
                    color:
                      useBrowser === opt.key
                        ? "var(--color-accent, #f5e642)"
                        : "var(--color-text-secondary, #a0a0a0)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 px-4 py-3 rounded-lg">
              {error}
            </p>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={handleCreateStream}
            disabled={!title}
            loading={status === "creating"}
          >
            Create stream
          </Button>
        </div>
      ) : (
        stream && (
          /* Step 2 — Stream ready */
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-sm text-green-400 font-medium">
                Stream created — you&apos;re ready to go live!
              </p>
            </div>

            {/* Stream info */}
            <div className="rounded-xl border border-border bg-bg-surface p-5 flex flex-col gap-4">
              <p className="text-sm font-medium text-text-primary">
                Stream details
              </p>

              {/* Playback URL */}
              <div>
                <p className="text-xs text-text-muted mb-1.5">Viewer URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-bg-elevated px-3 py-2 rounded-lg text-text-secondary truncate border border-border">
                    {typeof window !== "undefined"
                      ? window.location.origin
                      : ""}
                    /stream/{stream.playbackId}
                  </code>
                  <button
                    onClick={() =>
                      handleCopy(
                        `${window.location.origin}/stream/${stream.playbackId}`,
                        "url",
                      )
                    }
                    className="text-xs px-3 py-2 rounded-lg border border-border text-text-muted hover:text-text-primary hover:border-border-hover transition-all flex-shrink-0"
                  >
                    {copied === "url" ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* RTMP for OBS */}
              {!useBrowser && (
                <>
                  <div>
                    <p className="text-xs text-text-muted mb-1.5">
                      RTMP Ingest URL (for OBS)
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-bg-elevated px-3 py-2 rounded-lg text-text-secondary truncate border border-border">
                        {stream.rtmpIngestUrl}
                      </code>
                      <button
                        onClick={() => handleCopy(stream.rtmpIngestUrl, "rtmp")}
                        className="text-xs px-3 py-2 rounded-lg border border-border text-text-muted hover:text-text-primary transition-all flex-shrink-0"
                      >
                        {copied === "rtmp" ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-text-muted mb-1.5">
                      Stream Key (keep secret!)
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-bg-elevated px-3 py-2 rounded-lg text-text-secondary truncate border border-border">
                        {stream.streamKey}
                      </code>
                      <button
                        onClick={() => handleCopy(stream.streamKey, "key")}
                        className="text-xs px-3 py-2 rounded-lg border border-border text-text-muted hover:text-text-primary transition-all flex-shrink-0"
                      >
                        {copied === "key" ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg bg-bg-elevated border border-border p-3">
                    <p className="text-xs text-text-muted leading-relaxed">
                      <span className="text-text-secondary font-medium">
                        OBS Setup:{" "}
                      </span>
                      Go to Settings → Stream → Service: Custom → paste RTMP URL
                      and Stream Key above.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Browser broadcast */}
            {useBrowser && (
              <div className="rounded-xl border border-border bg-bg-surface overflow-hidden">
                <div className="p-4 border-b border-border">
                  <p className="text-sm font-medium text-text-primary">
                    Browser broadcast
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Allow camera and microphone access to start streaming
                  </p>
                </div>
                <div className="p-4">
                  <Broadcast.Root ingestUrl={stream.whipUrl}>
                    <Broadcast.Container
                      style={{
                        width: "100%",
                        aspectRatio: "16/9",
                        backgroundColor: "#000",
                        borderRadius: 8,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <Broadcast.Video
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <Broadcast.Controls
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: "12px 16px",
                          background:
                            "linear-gradient(transparent, rgba(0,0,0,0.8))",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <Broadcast.EnabledTrigger
                          style={{
                            background: "#f5e642",
                            border: "none",
                            borderRadius: 8,
                            padding: "8px 16px",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            color: "#000",
                          }}
                        >
                          <Broadcast.EnabledIndicator asChild matcher={false}>
                            <span>🔴 Go Live</span>
                          </Broadcast.EnabledIndicator>
                          <Broadcast.EnabledIndicator asChild>
                            <span>⏹ Stop</span>
                          </Broadcast.EnabledIndicator>
                        </Broadcast.EnabledTrigger>

                        <Broadcast.VideoEnabledTrigger
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "white",
                            fontSize: 16,
                          }}
                        >
                          <Broadcast.VideoEnabledIndicator
                            asChild
                            matcher={false}
                          >
                            <span>📷</span>
                          </Broadcast.VideoEnabledIndicator>
                          <Broadcast.VideoEnabledIndicator asChild>
                            <span>🚫</span>
                          </Broadcast.VideoEnabledIndicator>
                        </Broadcast.VideoEnabledTrigger>

                        <Broadcast.AudioEnabledTrigger
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "white",
                            fontSize: 16,
                          }}
                        >
                          <Broadcast.AudioEnabledIndicator
                            asChild
                            matcher={false}
                          >
                            <span>🎤</span>
                          </Broadcast.AudioEnabledIndicator>
                          <Broadcast.AudioEnabledIndicator asChild>
                            <span>🔇</span>
                          </Broadcast.AudioEnabledIndicator>
                        </Broadcast.AudioEnabledTrigger>

                        <div style={{ flex: 1 }} />

                        <Broadcast.StatusIndicator
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                          matcher="live"
                        >
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#ef4444",
                              animation: "pulse 2s infinite",
                            }}
                          />
                          <span style={{ color: "white", fontSize: 12 }}>
                            LIVE
                          </span>
                        </Broadcast.StatusIndicator>
                      </Broadcast.Controls>
                    </Broadcast.Container>
                  </Broadcast.Root>
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatus("idle");
                setStream(null);
                setTitle("");
              }}
            >
              ← Create new stream
            </Button>
          </div>
        )
      )}
    </div>
  );
}
