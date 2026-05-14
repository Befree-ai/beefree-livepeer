"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { usePrivy } from "@privy-io/react-auth";
import FadeUp from "@/components/ui/FadeUp";

interface FanProfile {
  _id: string;
  name: string;
  avatar: string;
  role: string;
  followingCount: number;
  createdAt: string;
}

interface FollowingCreator {
  _id: string;
  name: string;
  avatar: string;
  followersCount: number;
  isVerified: boolean;
  genre: string[];
}

export default function FanProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const { exportWallet } = usePrivy();

  const [profile, setProfile] = useState<FanProfile | null>(null);
  const [followingCreators, setFollowing] = useState<FollowingCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isOwnProfile = user?._id === id;

  useEffect(() => {
    if (!id) return;
    fetch(`/api/users/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setProfile(data.data.user);
          setFollowing(data.data.followingCreators);
        } else {
          setError("Profile not found");
        }
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(user?.walletAddress || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg-primary)" }}>
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg-primary)" }}>
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <p style={{ color: "var(--color-text-muted)" }}>{error || "Profile not found"}</p>
        </main>
        <Footer />
      </div>
    );
  }

  const initial = profile.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg-primary)" }}>
      <Navbar />

      <main className="flex-1 pt-16 w-full">
        <div className="max-w-4xl mx-auto px-6 py-12">

          {/* Profile header */}
          <FadeUp>
            <div className="flex items-start gap-6 mb-10 pb-10"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
                style={{
                  background: "rgba(232,184,75,0.1)",
                  border: "1px solid rgba(232,184,75,0.2)",
                  color: "var(--color-accent)",
                }}
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name}
                    className="w-full h-full rounded-2xl object-cover" />
                ) : initial}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h1 className="text-2xl font-bold"
                    style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
                    {profile.name}
                  </h1>
                  {profile.role === "creator" && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(232,184,75,0.1)",
                        border: "1px solid rgba(232,184,75,0.2)",
                        color: "var(--color-accent)",
                      }}>
                      Creator
                    </span>
                  )}
                  {isOwnProfile && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(232,52,138,0.08)",
                        border: "1px solid rgba(232,52,138,0.15)",
                        color: "var(--color-pink)",
                      }}>
                      You
                    </span>
                  )}
                </div>

                <p className="text-sm mb-1" style={{ color: "var(--color-text-muted)" }}>
                  Following {profile.followingCount} creators
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Joined {new Date(profile.createdAt).toLocaleDateString("en-IN", {
                    month: "long", year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </FadeUp>

          {/* Wallet — own profile only */}
          {isOwnProfile && user?.walletAddress && (
            <FadeUp delay={0.05}>
              <div className="mb-10 rounded-2xl p-6"
                style={{
                  background: "rgba(232,184,75,0.04)",
                  border: "1px solid rgba(232,184,75,0.15)",
                }}>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <h2 className="font-bold text-base mb-0.5"
                      style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
                      Your BeeFree Wallet
                    </h2>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      Self-custodial Ethereum wallet — fully owned by you
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: "rgba(29,158,117,0.1)",
                      border: "1px solid rgba(29,158,117,0.25)",
                      color: "#1D9E75",
                    }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#1D9E75" }} />
                    Active
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl flex-1 min-w-0"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                    <span className="text-xs font-mono truncate"
                      style={{ color: "var(--color-text-secondary)" }}>
                      {user.walletAddress}
                    </span>
                  </div>
                  <button onClick={handleCopy}
                    className="text-xs px-4 py-2.5 rounded-xl font-medium transition-all flex-shrink-0"
                    style={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "transparent",
                      color: copied ? "#1D9E75" : "var(--color-text-secondary)",
                      cursor: "pointer",
                    }}>
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={exportWallet}
                    className="text-xs px-4 py-2.5 rounded-xl font-medium transition-all flex-shrink-0"
                    style={{
                      border: "1px solid rgba(232,184,75,0.3)",
                      background: "rgba(232,184,75,0.08)",
                      color: "var(--color-accent)",
                      cursor: "pointer",
                    }}>
                    Export key ↗
                  </button>
                </div>

                <p className="text-xs mt-3" style={{ color: "var(--color-text-muted)" }}>
                  Export gives you full control — import into MetaMask or any Ethereum wallet
                </p>
              </div>
            </FadeUp>
          )}

          {/* Following list */}
          <FadeUp delay={0.1}>
            <div>
              <h2 className="font-bold text-xl mb-6"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
                {isOwnProfile ? "Creators you follow" : "Following"}
              </h2>

              {followingCreators.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-dashed"
                  style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
                    {isOwnProfile
                      ? "You're not following any creators yet"
                      : "Not following any creators yet"}
                  </p>
                  {isOwnProfile && (
                    <Link href="/explore"
                      className="text-sm font-medium hover:underline"
                      style={{ color: "var(--color-accent)" }}>
                      Discover creators →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {followingCreators.map((creator, i) => (
                    <Link key={creator._id} href={`/creator/${creator._id}`}>
                      <div
                        className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.01]"
                        style={{
                          background: "var(--color-bg-surface)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        {/* Avatar */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                          style={{
                            background: `hsl(${i * 40 + 20}, 60%, 20%)`,
                            color: `hsl(${i * 40 + 20}, 80%, 70%)`,
                          }}
                        >
                          {creator.avatar ? (
                            <img src={creator.avatar} alt={creator.name}
                              className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            creator.name?.charAt(0)?.toUpperCase() || "?"
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-sm"
                              style={{ color: "var(--color-text-primary)" }}>
                              {creator.name}
                            </p>
                            {creator.isVerified && (
                              <svg width="12" height="12" viewBox="0 0 24 24"
                                fill="var(--color-accent)">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            {creator.followersCount} followers
                            {creator.genre?.length > 0 && (
                              <> · {creator.genre.slice(0, 2).join(", ")}</>
                            )}
                          </p>
                        </div>

                        <span style={{ color: "var(--color-text-muted)" }}>→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </FadeUp>

        </div>
      </main>

      <Footer />
    </div>
  );
}
