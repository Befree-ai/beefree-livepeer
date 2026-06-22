"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { IVideo } from "@/types";
import { usePrivy } from "@privy-io/react-auth";
import FadeUp from "@/components/ui/FadeUp";

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: accent ? "rgba(232,184,75,0.06)" : "var(--color-bg-surface)",
        border: accent
          ? "1px solid rgba(232,184,75,0.2)"
          : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{
          background: accent ? "rgba(232,184,75,0.12)" : "rgba(255,255,255,0.04)",
          color: accent ? "var(--color-accent)" : "var(--color-text-muted)",
        }}
      >
        {icon}
      </div>
      <div>
        <p
          className="text-2xl font-bold mb-0.5"
          style={{
            fontFamily: "var(--font-display)",
            color: accent ? "var(--color-accent)" : "var(--color-text-primary)",
          }}
        >
          {value}
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

// ── Quick Action Card ─────────────────────────────────────────────────────────
function ActionCard({
  title,
  desc,
  href,
  cta,
  icon,
}: {
  title: string;
  desc: string;
  href: string;
  cta: string;
  icon: string;
}) {
  return (
    <Link href={href}>
      <div
        className="rounded-2xl p-5 flex flex-col gap-4 h-full cursor-pointer hover:scale-[1.02] transition-all group"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <p
            className="font-semibold text-sm mb-1 group-hover:text-accent transition-colors"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-text-primary)",
            }}
          >
            {title}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            {desc}
          </p>
        </div>
        <span
          className="text-xs font-semibold"
          style={{ color: "var(--color-accent)" }}
        >
          {cta} →
        </span>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const { exportWallet } = usePrivy();

  const [videoCount, setVideoCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?._id) return;
    fetch(`/api/videos?creator=${user._id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setVideoCount(data.data.total);
          setTotalViews(
            data.data.videos.reduce(
              (sum: number, v: IVideo) => sum + (v.viewCount || 0),
              0
            )
          );
        }
      });
  }, [user?._id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(user?.walletAddress || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Header */}
      <FadeUp>
        <div className="mb-8">
          <p
            className="text-xs font-semibold tracking-widest mb-2 uppercase"
            style={{ color: "var(--color-accent)" }}
          >
            Dashboard
          </p>
          <h1
            className="text-3xl font-bold mb-1"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-text-primary)",
            }}
          >
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Here's an overview of your channel
          </p>
        </div>
      </FadeUp>

      {/* Stats grid */}
      <FadeUp delay={0.05}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total videos"
            value={videoCount}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            }
          />
          <StatCard
            label="Total followers"
            value={user?.followersCount || 0}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
          <StatCard
            label="Total views"
            value={totalViews.toLocaleString()}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            }
          />
          <StatCard
            label="Total earnings"
            value="₹0"
            accent
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            }
          />
        </div>
      </FadeUp>

      {/* Wallet */}
      {user?.walletAddress && (
        <FadeUp delay={0.1}>
          <div
            className="mb-8 rounded-2xl p-6"
            style={{
              background: "rgba(232,184,75,0.04)",
              border: "1px solid rgba(232,184,75,0.15)",
            }}
          >
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2
                  className="font-bold text-base mb-0.5"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  Your LyveFree Wallet
                </h2>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Self-custodial Ethereum wallet — fully owned by you
                </p>
              </div>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(29,158,117,0.1)",
                  border: "1px solid rgba(29,158,117,0.25)",
                  color: "#1D9E75",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#1D9E75" }} />
                Active
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl flex-1 min-w-0"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>
                  <rect x="2" y="6" width="20" height="14" rx="2" />
                  <path d="M16 12h2" /><path d="M2 10h20" />
                </svg>
                <span
                  className="text-xs font-mono truncate"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {user.walletAddress}
                </span>
              </div>

              <button
                onClick={handleCopy}
                className="text-xs px-4 py-2.5 rounded-xl transition-all flex-shrink-0 font-medium"
                style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  color: copied ? "#1D9E75" : "var(--color-text-secondary)",
                  cursor: "pointer",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>

              <button
                onClick={exportWallet}
                className="text-xs px-4 py-2.5 rounded-xl transition-all flex-shrink-0 font-medium"
                style={{
                  border: "1px solid rgba(232,184,75,0.3)",
                  background: "rgba(232,184,75,0.08)",
                  color: "var(--color-accent)",
                  cursor: "pointer",
                }}
              >
                Export key ↗
              </button>
            </div>

            <p className="text-xs mt-3" style={{ color: "var(--color-text-muted)" }}>
              Export gives you full control — import into MetaMask or any Ethereum wallet
            </p>
          </div>
        </FadeUp>
      )}

      {/* Quick actions */}
      <FadeUp delay={0.15}>
        <div className="mb-8">
          <h2
            className="font-bold text-base mb-4"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
          >
            Quick actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionCard
              icon="🎬"
              title="Upload a video"
              desc="Share music, performances, or exclusive content with your fans"
              href="/dashboard/upload"
              cta="Upload now"
            />
            <ActionCard
              icon="🔴"
              title="Go live"
              desc="Start a live stream and connect directly with your fans in real time"
              href="/dashboard/stream"
              cta="Start stream"
            />
            <ActionCard
              icon="👤"
              title="View your profile"
              desc="See how your public profile looks to fans visiting your page"
              href={`/creator/${user?._id}`}
              cta="View profile"
            />
          </div>
        </div>
      </FadeUp>

      {/* Profile completion nudge */}
      {!user?.bio && (
        <FadeUp delay={0.2}>
          <div
            className="rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap"
            style={{
              background: "rgba(232,52,138,0.05)",
              border: "1px solid rgba(232,52,138,0.15)",
            }}
          >
            <div>
              <p
                className="text-sm font-semibold mb-0.5"
                style={{ color: "var(--color-pink)" }}
              >
                Complete your profile
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Add a bio and genres to help fans discover you
              </p>
            </div>
            <Link href="/dashboard/profile">
              <button
                className="px-5 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all hover:opacity-90"
                style={{
                  background: "var(--color-pink)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Edit profile →
              </button>
            </Link>
          </div>
        </FadeUp>
      )}
    </div>
  );
}
