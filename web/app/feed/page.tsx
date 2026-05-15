"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { usePrivy } from "@privy-io/react-auth";
import { IVideo, ICreator } from "@/types";
import FadeUp from "@/components/ui/FadeUp";

interface FeedVideo extends IVideo {
  creator: ICreator;
}

// ── Video Card ────────────────────────────────────────────────────────────────
function FeedVideoCard({ video }: { video: FeedVideo }) {
  const isPremium = video.access === "premium";
  const creator = video.creator as ICreator;
  const thumbnail = video.thumbnailUrl || null;

  return (
    <div
      className="group rounded-2xl overflow-hidden transition-all hover:scale-[1.02]"
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        background: "var(--color-bg-surface)",
      }}
    >
      {/* Thumbnail */}
      <Link href={isPremium ? `/creator/${creator._id}` : `/video/${video._id}`}>
        <div className="aspect-video bg-bg-elevated relative overflow-hidden">
          {thumbnail && (
            <img
              src={thumbnail}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}

          {/* Premium overlay */}
          {isPremium && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style={{ background: "rgba(8,8,8,0.65)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(232,184,75,0.15)",
                  border: "1px solid rgba(232,184,75,0.3)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  style={{ color: "var(--color-accent)" }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <span className="text-xs font-semibold" style={{ color: "var(--color-accent)" }}>
                Subscribe to watch
              </span>
            </div>
          )}

          {/* Access badge */}
          <div className="absolute top-2.5 right-2.5">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: isPremium ? "rgba(232,52,138,0.2)" : "rgba(29,158,117,0.2)",
                border: isPremium ? "1px solid rgba(232,52,138,0.4)" : "1px solid rgba(29,158,117,0.4)",
                color: isPremium ? "var(--color-pink)" : "#1D9E75",
              }}
            >
              {isPremium ? "Premium" : "Free"}
            </span>
          </div>

          {/* Duration placeholder bottom left */}
          {(video.duration ?? 0) > 0 && (
            <div
              className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-xs font-semibold"
              style={{ background: "rgba(0,0,0,0.8)", color: "#fff" }}
            >
              {Math.floor((video.duration ?? 0) / 60)}:{String((video.duration ?? 0) % 60).padStart(2, "0")}
            </div>
          )}
        </div>
      </Link>

      {/* Info row */}
      <div className="p-3 flex gap-3">
        {/* Creator avatar */}
        <Link href={`/creator/${creator._id}`} className="flex-shrink-0 mt-0.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold overflow-hidden"
            style={{
              background: "rgba(232,184,75,0.1)",
              border: "1px solid rgba(232,184,75,0.2)",
              color: "var(--color-accent)",
            }}
          >
            {creator.avatar ? (
              <img src={creator.avatar} alt={creator.name}
                className="w-full h-full object-cover" />
            ) : (
              creator.name?.charAt(0)?.toUpperCase() || "?"
            )}
          </div>
        </Link>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <Link href={isPremium ? `/creator/${creator._id}` : `/video/${video._id}`}>
            <p
              className="text-sm font-semibold line-clamp-2 mb-1 group-hover:text-accent transition-colors leading-snug"
              style={{ color: "var(--color-text-primary)" }}
            >
              {video.title}
            </p>
          </Link>
          <Link href={`/creator/${creator._id}`}>
            <div className="flex items-center gap-1">
              <p
                className="text-xs hover:text-text-secondary transition-colors"
                style={{ color: "var(--color-text-muted)" }}
              >
                {creator.name}
              </p>
              {creator.isVerified && (
                <svg width="11" height="11" viewBox="0 0 24 24"
                  fill="var(--color-accent)">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          </Link>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {video.viewCount} views
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function FeedSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{ border: "1px solid rgba(255,255,255,0.06)", background: "var(--color-bg-surface)" }}
    >
      <div className="aspect-video" style={{ background: "var(--color-bg-elevated)" }} />
      <div className="p-3 flex gap-3">
        <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: "var(--color-bg-elevated)" }} />
        <div className="flex-1">
          <div className="h-3.5 rounded mb-2 w-full" style={{ background: "var(--color-bg-elevated)" }} />
          <div className="h-3 rounded mb-1.5 w-2/3" style={{ background: "var(--color-bg-elevated)" }} />
          <div className="h-3 rounded w-1/3" style={{ background: "var(--color-bg-elevated)" }} />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const { user } = useAuth();
  const { getAccessToken } = usePrivy();

  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = useCallback(async (pageNum: number, append = false) => {
    try {
      const token = await getAccessToken().catch(() => null);
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/feed?page=${pageNum}`, { headers });
      const data = await res.json();

      if (data.success) {
        if (append) {
          setVideos((prev) => [...prev, ...data.data.videos]);
        } else {
          setVideos(data.data.videos);
        }
        setHasMore(data.data.hasMore);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    fetchFeed(1);
  }, [fetchFeed]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage, true);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg-primary)" }}>
      <Navbar />

      <main className="flex-1 pt-16 w-full">
        <div className="max-w-6xl mx-auto px-6 py-10">

          {/* Header */}
          <FadeUp>
            <div className="mb-8">
              <p
                className="text-xs font-semibold tracking-widest mb-2 uppercase"
                style={{ color: "var(--color-accent)" }}
              >
                {user?.followingCount ? "Following" : "Discover"}
              </p>
              <h1
                className="text-3xl md:text-4xl font-bold mb-1"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
              >
                {user?.followingCount ? "Your feed" : "Latest from Indian artists"}
              </h1>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {user?.followingCount
                  ? "Latest from creators you follow"
                  : "Explore music from independent creators"}
              </p>
            </div>
          </FadeUp>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <FeedSkeleton key={i} />
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div
              className="text-center py-32 rounded-2xl border border-dashed"
              style={{ borderColor: "rgba(255,255,255,0.07)" }}
            >
              <p
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
              >
                Nothing here yet.
              </p>
              <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
                Follow some creators to see their latest content.
              </p>
              <Link href="/explore">
                <button
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: "var(--color-accent)", color: "#000", border: "none", cursor: "pointer" }}
                >
                  Discover creators →
                </button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {videos.map((video) => (
                  <FeedVideoCard key={video._id} video={video} />
                ))}
              </div>

              {hasMore && (
                <div className="mt-12 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-8 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "transparent",
                      color: "var(--color-text-secondary)",
                      cursor: loadingMore ? "not-allowed" : "pointer",
                      opacity: loadingMore ? 0.6 : 1,
                    }}
                  >
                    {loadingMore ? "Loading..." : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
