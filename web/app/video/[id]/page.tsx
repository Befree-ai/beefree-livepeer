"use client";

import {
  useEffect, useState, forwardRef,
  type CSSProperties, type PropsWithChildren,
} from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import * as Player from "@livepeer/react/player";
import { getSrc } from "@livepeer/react/external";
import {
  LoadingIcon, MuteIcon, PauseIcon, PlayIcon,
  SettingsIcon, UnmuteIcon,
} from "@livepeer/react/assets";
import * as Popover from "@radix-ui/react-popover";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { IVideo, ICreator } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { usePrivy } from "@privy-io/react-auth";
import FadeUp from "@/components/ui/FadeUp";

// ── Player sub-components (unchanged) ────────────────────────────────────────
const Loading = forwardRef<HTMLDivElement, PropsWithChildren>(({ ...props }, ref) => (
  <div {...props} ref={ref} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "black" }}>
    <LoadingIcon style={{ width: 32, height: 32, animation: "spin 1s linear infinite" }} />
  </div>
));
Loading.displayName = "Loading";

const Seek = forwardRef<HTMLButtonElement, Player.SeekProps>(({ ...props }, ref) => (
  <Player.Seek ref={ref} {...props} style={{ position: "relative", height: 20, display: "flex", alignItems: "center", userSelect: "none", touchAction: "none", width: "100%" }}>
    <Player.Track style={{ backgroundColor: "rgba(255,255,255,0.3)", position: "relative", flexGrow: 1, borderRadius: 9999, height: 3 }}>
      <Player.SeekBuffer style={{ position: "absolute", backgroundColor: "rgba(255,255,255,0.4)", borderRadius: 9999, height: "100%" }} />
      <Player.Range style={{ position: "absolute", backgroundColor: "white", borderRadius: 9999, height: "100%" }} />
    </Player.Track>
    <Player.Thumb style={{ display: "block", width: 12, height: 12, backgroundColor: "white", borderRadius: 9999 }} />
  </Player.Seek>
));
Seek.displayName = "Seek";

const RateSelectItem = forwardRef<HTMLDivElement, Player.RateSelectItemProps>(({ children, ...props }, ref) => (
  <Player.RateSelectItem style={{ fontSize: 12, borderRadius: 4, display: "flex", alignItems: "center", paddingRight: 35, paddingLeft: 25, position: "relative", userSelect: "none", height: 30, cursor: "pointer", color: "white" }} {...props} ref={ref}>
    <Player.SelectItemText>{children}</Player.SelectItemText>
    <Player.SelectItemIndicator style={{ position: "absolute", left: 0, width: 25, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CheckIcon style={{ width: 12, height: 12 }} />
    </Player.SelectItemIndicator>
  </Player.RateSelectItem>
));
RateSelectItem.displayName = "RateSelectItem";

const VideoQualitySelectItem = forwardRef<HTMLDivElement, Player.VideoQualitySelectItemProps>(({ children, ...props }, ref) => (
  <Player.VideoQualitySelectItem style={{ fontSize: 12, borderRadius: 4, display: "flex", alignItems: "center", paddingRight: 35, paddingLeft: 25, position: "relative", userSelect: "none", height: 30, cursor: "pointer", color: "white" }} {...props} ref={ref}>
    <Player.SelectItemText>{children}</Player.SelectItemText>
    <Player.SelectItemIndicator style={{ position: "absolute", left: 0, width: 25, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CheckIcon style={{ width: 12, height: 12 }} />
    </Player.SelectItemIndicator>
  </Player.VideoQualitySelectItem>
));
VideoQualitySelectItem.displayName = "VideoQualitySelectItem";

const Settings = forwardRef<HTMLButtonElement, { style?: CSSProperties }>(({ style }, ref) => (
  <Popover.Root>
    <Popover.Trigger ref={ref} asChild>
      <button type="button" style={{ background: "transparent", border: "none", cursor: "pointer", ...style }} aria-label="Playback settings" onClick={e => e.stopPropagation()}>
        <SettingsIcon style={{ width: 20, height: 20, color: "white" }} />
      </button>
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content style={{ width: 220, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", padding: 12, zIndex: 9999 }} side="top" alignOffset={-70} align="end" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "white", fontWeight: 500 }}>Settings</p>
          <Player.LiveIndicator matcher={false} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Speed</label>
            <Player.RateSelect name="rateSelect">
              <Player.SelectTrigger style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 32, width: "100%", fontSize: 12, padding: "0 10px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer" }} aria-label="Playback speed">
                <Player.SelectValue placeholder="Speed..." />
                <Player.SelectIcon><ChevronDownIcon style={{ width: 12, height: 12 }} /></Player.SelectIcon>
              </Player.SelectTrigger>
              <Player.SelectPortal>
                <Player.SelectContent position="popper" style={{ borderRadius: 5, backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.15)", zIndex: 99999, width: "var(--radix-select-trigger-width)" }}>
                  <Player.SelectViewport style={{ padding: 4 }}>
                    <Player.SelectGroup>
                      <RateSelectItem value={0.5}>0.5x</RateSelectItem>
                      <RateSelectItem value={0.75}>0.75x</RateSelectItem>
                      <RateSelectItem value={1}>1x (Normal)</RateSelectItem>
                      <RateSelectItem value={1.25}>1.25x</RateSelectItem>
                      <RateSelectItem value={1.5}>1.5x</RateSelectItem>
                      <RateSelectItem value={2}>2x</RateSelectItem>
                    </Player.SelectGroup>
                  </Player.SelectViewport>
                </Player.SelectContent>
              </Player.SelectPortal>
            </Player.RateSelect>
          </Player.LiveIndicator>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Quality</label>
            <Player.VideoQualitySelect name="qualitySelect">
              <Player.SelectTrigger style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 32, width: "100%", fontSize: 12, padding: "0 10px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer" }} aria-label="Playback quality">
                <Player.SelectValue placeholder="Quality..." />
                <Player.SelectIcon><ChevronDownIcon style={{ width: 12, height: 12 }} /></Player.SelectIcon>
              </Player.SelectTrigger>
              <Player.SelectPortal>
                <Player.SelectContent position="popper" style={{ borderRadius: 5, backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.15)", zIndex: 99999, width: "var(--radix-select-trigger-width)" }}>
                  <Player.SelectViewport style={{ padding: 4 }}>
                    <Player.SelectGroup>
                      <VideoQualitySelectItem value="auto">Auto (HD+)</VideoQualitySelectItem>
                      <VideoQualitySelectItem value="1080p">1080p</VideoQualitySelectItem>
                      <VideoQualitySelectItem value="720p">720p</VideoQualitySelectItem>
                      <VideoQualitySelectItem value="360p">360p</VideoQualitySelectItem>
                    </Player.SelectGroup>
                  </Player.SelectViewport>
                </Player.SelectContent>
              </Player.SelectPortal>
            </Player.VideoQualitySelect>
          </div>
        </div>
        <Popover.Close style={{ borderRadius: 9999, height: 20, width: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", position: "absolute", top: 6, right: 6, background: "transparent", border: "none", cursor: "pointer", color: "white" }} aria-label="Close">
          <XIcon style={{ width: 12, height: 12 }} />
        </Popover.Close>
        <Popover.Arrow style={{ fill: "rgba(255,255,255,0.15)" }} />
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
));
Settings.displayName = "Settings";

// ── Main page ─────────────────────────────────────────────────────────────────
export default function VideoPage() {
  const params = useParams();
  const id = params?.id as string;
  const [video, setVideo] = useState<IVideo | null>(null);
  const [src, setSrc] = useState<ReturnType<typeof getSrc>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { getAccessToken } = usePrivy();
  const [jwt, setJwt] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/videos/${id}`)
      .then(r => r.json())
      .then(async data => {
        if (!data.success) { setError("Video not found"); return; }
        setVideo(data.data);
        const playbackRes = await fetch(`/api/playback/${data.data.playbackId}`);
        const playbackData = await playbackRes.json();
        if (data.data.access === "premium") {
          const token = await getAccessToken();
          if (token) {
            const jwtRes = await fetch(`/api/videos/${id}/jwt`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const jwtData = await jwtRes.json();
            if (jwtData.success) {
              setJwt(jwtData.data.jwt);
              if (playbackData.success) setSrc(getSrc(playbackData.data.playbackInfo));
            }
          }
        } else {
          if (playbackData.success) setSrc(getSrc(playbackData.data.playbackInfo));
        }
      })
      .catch(() => setError("Failed to load video"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg-primary)" }}>
        <Navbar />
        <main className="flex-1 pt-16 max-w-5xl mx-auto px-6 py-10 w-full">
          <div className="animate-pulse">
            <div className="aspect-video rounded-2xl mb-6" style={{ background: "var(--color-bg-elevated)" }} />
            <div className="h-6 rounded mb-3 w-2/3" style={{ background: "var(--color-bg-elevated)" }} />
            <div className="h-4 rounded w-1/3" style={{ background: "var(--color-bg-elevated)" }} />
          </div>
        </main>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg-primary)" }}>
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <p style={{ color: "var(--color-text-muted)" }}>{error || "Video not found"}</p>
        </main>
      </div>
    );
  }

  const creator: ICreator | null = video.creator && typeof video.creator === "object"
    ? (video.creator as ICreator) : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg-primary)" }}>
      <Navbar />
      <main className="flex-1 pt-16 w-full">
        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* Player */}
          <FadeUp>
            <div className="rounded-2xl overflow-hidden mb-6"
              style={{ background: "#000", border: "1px solid rgba(255,255,255,0.08)" }}>
              {src ? (
                <Player.Root src={src} autoPlay volume={0} jwt={jwt ?? undefined}>
                  <Player.Container style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", backgroundColor: "black", position: "relative" }}>
                    <Player.Video style={{ height: "100%", width: "100%", objectFit: "contain" }} />
                    <Player.LoadingIndicator asChild><Loading /></Player.LoadingIndicator>
                    <Player.ErrorIndicator matcher="all" asChild><Loading /></Player.ErrorIndicator>
                    <Player.Controls style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7))", padding: "0.5rem 1rem", display: "flex", flexDirection: "column-reverse", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Player.PlayPauseTrigger style={{ width: 24, height: 24, background: "transparent", border: "none", cursor: "pointer" }}>
                          <Player.PlayingIndicator asChild matcher={false}><PlayIcon style={{ color: "white", width: 20, height: 20 }} /></Player.PlayingIndicator>
                          <Player.PlayingIndicator asChild><PauseIcon style={{ color: "white", width: 20, height: 20 }} /></Player.PlayingIndicator>
                        </Player.PlayPauseTrigger>
                        <Player.MuteTrigger style={{ width: 24, height: 24, background: "transparent", border: "none", cursor: "pointer" }}>
                          <Player.VolumeIndicator asChild matcher={false}><MuteIcon style={{ color: "white", width: 20, height: 20 }} /></Player.VolumeIndicator>
                          <Player.VolumeIndicator asChild matcher={true}><UnmuteIcon style={{ color: "white", width: 20, height: 20 }} /></Player.VolumeIndicator>
                        </Player.MuteTrigger>
                        <Player.Volume style={{ position: "relative", display: "flex", alignItems: "center", height: 24, maxWidth: 80, flexGrow: 1, touchAction: "none", userSelect: "none" }}>
                          <Player.Track style={{ backgroundColor: "rgba(255,255,255,0.4)", position: "relative", flexGrow: 1, borderRadius: 9999, height: 2 }}>
                            <Player.Range style={{ position: "absolute", backgroundColor: "white", borderRadius: 9999, height: "100%" }} />
                          </Player.Track>
                          <Player.Thumb style={{ display: "block", width: 10, height: 10, backgroundColor: "white", borderRadius: 9999 }} />
                        </Player.Volume>
                        <Player.Time style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, userSelect: "none" }} />
                        <div style={{ flex: 1 }} />
                        <Settings />
                        <Player.FullscreenTrigger style={{ width: 24, height: 24, background: "transparent", border: "none", cursor: "pointer" }}>
                          <Player.FullscreenIndicator asChild matcher={false}><span style={{ color: "white", fontSize: 16 }}>⛶</span></Player.FullscreenIndicator>
                          <Player.FullscreenIndicator asChild><span style={{ color: "white", fontSize: 16 }}>✕</span></Player.FullscreenIndicator>
                        </Player.FullscreenTrigger>
                      </div>
                      <Seek />
                    </Player.Controls>
                  </Player.Container>
                </Player.Root>
              ) : (
                <div style={{ aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                      style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {video.status === "processing" ? "Video is still processing..." : "Loading video..."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </FadeUp>

          {/* Video info */}
          <FadeUp delay={0.1}>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold"
                  style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
                  {video.title}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: video.access === "premium"
                      ? "rgba(232,52,138,0.1)" : "rgba(29,158,117,0.1)",
                    border: video.access === "premium"
                      ? "1px solid rgba(232,52,138,0.25)" : "1px solid rgba(29,158,117,0.25)",
                    color: video.access === "premium"
                      ? "var(--color-pink)" : "#1D9E75",
                  }}>
                  {video.access === "premium" ? "Premium" : "Free"}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {video.viewCount} views
              </p>
            </div>

            <div className="h-px mb-6" style={{ background: "rgba(255,255,255,0.06)" }} />

            {/* Creator */}
            {creator && (
              <Link href={`/creator/${creator._id}`}
                className="flex items-center gap-3 mb-6 group w-fit">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold overflow-hidden"
                  style={{ background: "rgba(232,184,75,0.1)", border: "1px solid rgba(232,184,75,0.2)", color: "var(--color-accent)" }}>
                  {creator.avatar ? (
                    <img src={creator.avatar} alt={creator.name || "Creator"}
                      className="w-full h-full object-cover" />
                  ) : (
                    creator.name?.charAt(0)?.toUpperCase() || "?"
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold group-hover:text-accent transition-colors"
                    style={{ color: "var(--color-text-primary)" }}>
                    {creator.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {creator.followersCount} followers
                  </p>
                </div>
              </Link>
            )}

            {/* Description */}
            {video.description && (
              <div className="rounded-2xl p-4 mb-4"
                style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: "var(--color-text-secondary)" }}>
                  {video.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {video.tags && video.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {video.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "var(--color-text-muted)",
                    }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </FadeUp>

        </div>
      </main>
    </div>
  );
}
