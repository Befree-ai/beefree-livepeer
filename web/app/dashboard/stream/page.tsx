"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePrivy } from "@privy-io/react-auth";
import * as Broadcast from "@livepeer/react/broadcast";
import { getIngest } from "@livepeer/react/external";
import FadeUp from "@/components/ui/FadeUp";

type StreamStatus = "idle" | "creating" | "ready" | "live" | "error";

interface StreamData {
  streamId: string;
  streamKey: string;
  playbackId: string;
  rtmpIngestUrl: string;
  whipUrl: string;
}

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  color: "var(--color-text-primary)",
  fontSize: "14px",
  outline: "none",
};

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

  useEffect(() => {
    return () => {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          stream.getTracks().forEach((track) => track.stop());
        })
        .catch(() => {});
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
      <FadeUp>
        <div className="mb-8">
          <p
            className="text-xs font-semibold tracking-widest mb-2 uppercase"
            style={{ color: "var(--color-accent)" }}
          >
            Live
          </p>
          <h1
            className="text-3xl font-bold mb-1"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-text-primary)",
            }}
          >
            Go Live
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Stream directly to your fans in real time
          </p>
        </div>
      </FadeUp>

      {/* Step 1 — Setup */}
      {(status === "idle" || status === "creating" || status === "error") && (
        <FadeUp delay={0.05}>
          <div className="flex flex-col gap-6">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--color-text-primary)" }}
              >
                Stream title <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Live Q&A with fans"
                style={inputStyle}
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--color-text-primary)" }}
              >
                Access
              </label>
              <div className="flex gap-3">
                {(["free", "premium"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAccess(opt)}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor:
                        access === opt
                          ? "var(--color-accent)"
                          : "rgba(255,255,255,0.08)",
                      background:
                        access === opt
                          ? "rgba(232,184,75,0.08)"
                          : "transparent",
                      color:
                        access === opt
                          ? "var(--color-accent)"
                          : "var(--color-text-muted)",
                      cursor: "pointer",
                      fontWeight: access === opt ? 600 : 400,
                    }}
                  >
                    {opt === "free" ? "🌍 Free" : "🔒 Premium"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--color-text-primary)" }}
              >
                How will you stream?
              </label>
              <div className="flex gap-3">
                {[
                  { key: true, label: "🌐 Browser (recommended)" },
                  { key: false, label: "🎬 OBS / External" },
                ].map((opt) => (
                  <button
                    key={String(opt.key)}
                    onClick={() => setUseBrowser(opt.key)}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor:
                        useBrowser === opt.key
                          ? "var(--color-accent)"
                          : "rgba(255,255,255,0.08)",
                      background:
                        useBrowser === opt.key
                          ? "rgba(232,184,75,0.08)"
                          : "transparent",
                      color:
                        useBrowser === opt.key
                          ? "var(--color-accent)"
                          : "var(--color-text-muted)",
                      cursor: "pointer",
                      fontWeight: useBrowser === opt.key ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#ef4444",
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handleCreateStream}
              disabled={!title || status === "creating"}
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: !title
                  ? "rgba(232,184,75,0.3)"
                  : "var(--color-accent)",
                color: "#000",
                border: "none",
                cursor: !title ? "not-allowed" : "pointer",
              }}
            >
              {status === "creating" ? "Creating..." : "Create stream →"}
            </button>
          </div>
        </FadeUp>
      )}

      {/* Step 2 — Stream ready */}
      {stream &&
        status !== "idle" &&
        status !== "creating" &&
        status !== "error" && (
          <FadeUp delay={0.05}>
            <div className="flex flex-col gap-6">
              {/* Ready badge */}
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: "rgba(29,158,117,0.06)",
                  border: "1px solid rgba(29,158,117,0.2)",
                }}
              >
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "#1D9E75" }}
                />
                <p className="text-sm font-medium" style={{ color: "#1D9E75" }}>
                  Stream created — you're ready to go live!
                </p>
              </div>

              {/* Stream info card */}
              <div
                className="rounded-2xl p-5 flex flex-col gap-4"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Stream details
                </p>

                {/* Viewer URL */}
                <div>
                  <p
                    className="text-xs mb-1.5"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Viewer URL
                  </p>
                  <div className="flex items-center gap-2">
                    <code
                      className="flex-1 text-xs px-3 py-2 rounded-xl truncate"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
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
                      className="text-xs px-3 py-2 rounded-xl transition-all flex-shrink-0 font-medium"
                      style={{
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "transparent",
                        color:
                          copied === "url"
                            ? "#1D9E75"
                            : "var(--color-text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      {copied === "url" ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* OBS fields */}
                {!useBrowser && (
                  <>
                    <div>
                      <p
                        className="text-xs mb-1.5"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        RTMP Ingest URL
                      </p>
                      <div className="flex items-center gap-2">
                        <code
                          className="flex-1 text-xs px-3 py-2 rounded-xl truncate"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {stream.rtmpIngestUrl}
                        </code>
                        <button
                          onClick={() =>
                            handleCopy(stream.rtmpIngestUrl, "rtmp")
                          }
                          className="text-xs px-3 py-2 rounded-xl flex-shrink-0 font-medium"
                          style={{
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "transparent",
                            color:
                              copied === "rtmp"
                                ? "#1D9E75"
                                : "var(--color-text-muted)",
                            cursor: "pointer",
                          }}
                        >
                          {copied === "rtmp" ? "✓" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <p
                        className="text-xs mb-1.5"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        Stream Key{" "}
                        <span style={{ color: "#ef4444" }}>(keep secret!)</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <code
                          className="flex-1 text-xs px-3 py-2 rounded-xl truncate"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {stream.streamKey}
                        </code>
                        <button
                          onClick={() => handleCopy(stream.streamKey, "key")}
                          className="text-xs px-3 py-2 rounded-xl flex-shrink-0 font-medium"
                          style={{
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "transparent",
                            color:
                              copied === "key"
                                ? "#1D9E75"
                                : "var(--color-text-muted)",
                            cursor: "pointer",
                          }}
                        >
                          {copied === "key" ? "✓" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div
                      className="px-3 py-2.5 rounded-xl"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <span
                          style={{
                            color: "var(--color-text-secondary)",
                            fontWeight: 500,
                          }}
                        >
                          OBS Setup:{" "}
                        </span>
                        Settings → Stream → Service: Custom → paste RTMP URL and
                        Stream Key above.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Browser broadcast */}
              {useBrowser && (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "var(--color-bg-surface)",
                  }}
                >
                  <div
                    className="px-5 py-4"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      Browser broadcast
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--color-text-muted)" }}
                    >
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
                          borderRadius: 12,
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
                              background: "var(--color-accent)",
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
                              }}
                            />
                            <span
                              style={{
                                color: "white",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              LIVE
                            </span>
                          </Broadcast.StatusIndicator>
                        </Broadcast.Controls>
                      </Broadcast.Container>
                    </Broadcast.Root>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setStatus("idle");
                  setStream(null);
                  setTitle("");
                }}
                className="text-sm font-medium transition-all hover:opacity-70"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  textAlign: "left",
                }}
              >
                ← Create new stream
              </button>
            </div>
          </FadeUp>
        )}
    </div>
  );
}
