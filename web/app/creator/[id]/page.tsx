"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ICreator, IVideo } from "@/types";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePrivy } from "@privy-io/react-auth";

// ── Fake Web3 data ────────────────────────────────────────────────────────────
const FAKE_MARKET_CAP = "₹24.8L";
const FAKE_TOKEN_PRICE = "₹5.20";
const FAKE_TOKEN_SUPPLY = "10,000";
const FAKE_TOKEN_HOLDERS = "247";
const FAKE_ETH_BALANCE = "2.4 ETH";
const FAKE_BF_BALANCE = "12,400 BF";
const FAKE_TOKEN_BALANCE = "3,200 tks";

const FAKE_TRANSACTIONS = [
  { from: "rajesh_k", to: "you", amount: "+200 BF", time: "2m ago" },
  { from: "priya_m", to: "you", amount: "+1 ETH", time: "1h ago" },
  { from: "you", to: "arjun_d", amount: "-500 BF", time: "3h ago" },
  { from: "sunita_r", to: "you", amount: "+400 tks", time: "5h ago" },
  { from: "vikram_s", to: "you", amount: "+0.5 ETH", time: "1d ago" },
];

const FAKE_MESSAGES = [
  {
    id: 1,
    sender: "Sony Music India",
    avatar: "S",
    text: "Received collaboration request from Sony Music India.",
    action: "Offer Budget — ₹2,00,000",
    question: "Would you like to see the offer details?",
    time: "10:30 AM",
    type: "incoming",
  },
  {
    id: 2,
    sender: "you",
    avatar: "Y",
    text: "Yes please!",
    time: "10:45 AM",
    type: "outgoing",
  },
  {
    id: 3,
    sender: "Sony Music India",
    avatar: "S",
    text: "View offer details and proceed.",
    actions: ["Accept Offer", "Decline"],
    time: "11:00 AM",
    type: "incoming",
  },
];

// ── Video Card ────────────────────────────────────────────────────────────────
function VideoCard({
  video,
  isSubscribed,
  onSubscribeClick,
}: {
  video: IVideo;
  isSubscribed: boolean;
  onSubscribeClick: () => void;
}) {
  const isPremium = video.access === "premium";
  const isLocked = isPremium && !isSubscribed;

  if (isLocked) {
    return (
      <div
        className="group block rounded-2xl overflow-hidden cursor-pointer"
        style={{
          border: "1px solid rgba(255,255,255,0.06)",
          background: "var(--color-bg-surface)",
        }}
        onClick={onSubscribeClick}
      >
        <div
          className="aspect-video relative overflow-hidden"
          style={{ background: "var(--color-bg-elevated)" }}
        >
          {video.thumbnailUrl && (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover opacity-30"
            />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(232,184,75,0.15)",
                border: "1px solid rgba(232,184,75,0.3)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: "var(--color-accent)" }}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--color-accent)" }}
            >
              Subscribe to watch
            </span>
          </div>
          <div className="absolute top-2 right-2">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(232,52,138,0.2)",
                border: "1px solid rgba(232,52,138,0.4)",
                color: "var(--color-pink)",
              }}
            >
              Premium
            </span>
          </div>
        </div>
        <div className="p-3">
          <p
            className="font-semibold text-sm line-clamp-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {video.title}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            {video.viewCount} views
          </p>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/video/${video._id}`}
      className="group block rounded-2xl overflow-hidden transition-all hover:scale-[1.02]"
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        background: "var(--color-bg-surface)",
      }}
    >
      <div
        className="aspect-video relative overflow-hidden"
        style={{ background: "var(--color-bg-elevated)" }}
      >
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            🎬
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background:
                video.access === "premium"
                  ? "rgba(232,52,138,0.2)"
                  : "rgba(29,158,117,0.2)",
              border:
                video.access === "premium"
                  ? "1px solid rgba(232,52,138,0.4)"
                  : "1px solid rgba(29,158,117,0.4)",
              color:
                video.access === "premium" ? "var(--color-pink)" : "#1D9E75",
            }}
          >
            {video.access === "premium" ? "Premium" : "Free"}
          </span>
        </div>
      </div>
      <div className="p-3">
        <p
          className="font-semibold text-sm line-clamp-1 group-hover:text-accent transition-colors"
          style={{ color: "var(--color-text-primary)" }}
        >
          {video.title}
        </p>
        <p
          className="text-xs mt-0.5"
          style={{ color: "var(--color-text-muted)" }}
        >
          {video.viewCount} views
        </p>
      </div>
    </Link>
  );
}

// ── Panel tab type ────────────────────────────────────────────────────────────
type PanelTab = "tokens" | "transactions" | "messages";

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CreatorProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const { getAccessToken, login, exportWallet } = usePrivy();

  const [creator, setCreator] = useState<ICreator | null>(null);
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>("tokens");
  const [copied, setCopied] = useState(false);

  const isOwnProfile = user?._id === id;

  useEffect(() => {
    if (!id) return;
    fetch(`/api/creators/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCreator(data.data.creator);
          setVideos(data.data.videos);
        } else setError("Creator not found");
      })
      .catch(() => setError("Failed to load creator"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    if (user._id === id) {
      setIsSubscribed(true);
      return;
    }
    getAccessToken().then((token) => {
      if (!token) return;
      fetch(`/api/subscriptions?creatorId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setIsSubscribed(data.data.subscribed);
        });
    });
  }, [user, id]);

  useEffect(() => {
    if (!user || !id || user._id === id) return;
    getAccessToken().then((token) => {
      if (!token) return;
      fetch(`/api/follow/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setIsFollowing(data.data.isFollowing);
        });
    });
  }, [user, id]);

  const handleSubscribe = async () => {
    if (!user) {
      login();
      return;
    }
    setSubscribing(true);
    setSubscribeError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ creatorId: id }),
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Failed to create order");
      const { orderId, amount } = data.data;
      await loadRazorpayScript();
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency: "INR",
        name: "BeeFree",
        description: `Subscribe to ${creator?.name}`,
        order_id: orderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/subscriptions/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setIsSubscribed(true);
            setSubscribing(false);
          } else {
            setSubscribeError("Payment verification failed");
            setSubscribing(false);
          }
        },
        prefill: { name: user.name || "", email: user.email || "" },
        theme: { color: "#E8B84B" },
        modal: { ondismiss: () => setSubscribing(false) },
      };
      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      setSubscribeError(
        err instanceof Error ? err.message : "Failed to subscribe",
      );
      setSubscribing(false);
    }
  };

  const loadRazorpayScript = (): Promise<void> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  };

  // Format large numbers: 15600000 → "15.6M", 847000 → "847K"
  function formatCount(n: number): string {
    if (n >= 1_000_000)
      return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return n.toString();
  }

  const handleFollow = async () => {
    if (!user) {
      login();
      return;
    }
    setFollowLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/follow/${id}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.data.isFollowing);
        setCreator((prev) =>
          prev
            ? {
                ...prev,
                followersCount: prev.followersCount + (isFollowing ? -1 : 1),
              }
            : prev,
        );
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "var(--color-bg-primary)" }}
      >
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div
            className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderColor: "var(--color-accent)",
              borderTopColor: "transparent",
            }}
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "var(--color-bg-primary)" }}
      >
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <p style={{ color: "var(--color-text-muted)" }}>
            {error || "Creator not found"}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  const priceInRupees =
    Math.round((creator as any).subscriptionPrice / 100) || 99;
  const hasPremiumContent = videos.some((v) => v.access === "premium");
  const creatorInitial = creator.name?.charAt(0)?.toUpperCase() || "?";
  const tokenSymbol =
    creator.name?.split(" ")[0]?.toUpperCase()?.slice(0, 4) || "BEE";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-bg-primary)" }}
    >
      <Navbar />

      <main className="flex-1 w-full">
        {/* ── HERO COVER — full width, Spotify style ──────────────────── */}
        <div className="relative w-full pt-14" style={{ minHeight: "320px" }}>
          {/* Cover background */}
          <div
            className="absolute inset-0"
            style={{
              background: creator.avatar
                ? `linear-gradient(to bottom, rgba(8,8,8,0) 0%, rgba(8,8,8,0.6) 60%, rgba(8,8,8,1) 100%)`
                : "linear-gradient(135deg, #0d0d1a 0%, #1a0d2e 40%, #0d1a1a 100%)",
            }}
          >
            {/* Animated orbs in cover */}
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute rounded-full opacity-30"
                style={{
                  width: "600px",
                  height: "600px",
                  top: "-200px",
                  right: "10%",
                  background:
                    "radial-gradient(circle, rgba(232,184,75,0.3) 0%, transparent 65%)",
                  filter: "blur(60px)",
                }}
              />
              <div
                className="absolute rounded-full opacity-20"
                style={{
                  width: "400px",
                  height: "400px",
                  bottom: "-100px",
                  left: "5%",
                  background:
                    "radial-gradient(circle, rgba(232,52,138,0.4) 0%, transparent 65%)",
                  filter: "blur(50px)",
                }}
              />
            </div>
          </div>

          {/* Cover content */}
          <div className="relative max-w-7xl mx-auto px-6 pt-12 pb-0">
            <div className="flex flex-col md:flex-row items-end gap-6">
              {/* Large avatar */}
              <div className="flex-shrink-0 relative">
                <div
                  className="w-36 h-36 md:w-44 md:h-44 rounded-2xl flex items-center justify-center text-5xl font-bold overflow-hidden"
                  style={{
                    background: creator.avatar
                      ? "transparent"
                      : "linear-gradient(135deg, #E8B84B, #E8348A)",
                    color: "#000",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                    border: "3px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {creator.avatar ? (
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    creatorInitial
                  )}
                </div>
                {/* Verified badge */}
                {creator.isVerified && (
                  <div
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: "var(--color-accent)",
                      boxShadow: "0 4px 12px rgba(232,184,75,0.5)",
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#000"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Creator info */}
              <div className="flex-1 min-w-0 pb-6">
                {/* Verified label */}
                {creator.isVerified && (
                  <p
                    className="text-xs font-semibold tracking-widest uppercase mb-2"
                    style={{ color: "var(--color-accent)" }}
                  >
                    Verified Artist
                  </p>
                )}

                {/* Name — BIG */}
                <h1
                  className="text-4xl md:text-6xl font-bold mb-3 leading-none"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "#ffffff",
                  }}
                >
                  {creator.name}
                </h1>

                {/* Handle + bio */}
                <p
                  className="text-base mb-2"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  @{creator.name?.toLowerCase().replace(/\s+/g, "")}
                </p>
                {creator.bio && (
                  <p
                    className="text-sm leading-relaxed mb-4 max-w-xl"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    {creator.bio}
                  </p>
                )}

                {/* Genre tags */}
                {creator.genre && creator.genre.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {creator.genre.map((g) => (
                      <span
                        key={g}
                        className="text-xs px-3 py-1 rounded-full font-medium"
                        style={{
                          background: "rgba(255,255,255,0.1)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          color: "rgba(255,255,255,0.8)",
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-6 mb-6">
                  {[
                    {
                      label: "Followers",
                      value: formatCount(creator.followersCount || 0),
                    },
                    { label: "Market Cap", value: FAKE_MARKET_CAP },
                    { label: "Token Price", value: FAKE_TOKEN_PRICE },
                  ].map((s, i) => (
                    <div key={s.label}>
                      <p
                        className="text-xl font-bold"
                        style={{ color: "#fff" }}
                      >
                        {s.value}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Buy token / Subscribe */}
                  {user?._id !== id && (
                    <>
                      {isSubscribed ? (
                        <div
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                          style={{
                            background: "rgba(29,158,117,0.15)",
                            border: "1px solid rgba(29,158,117,0.3)",
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#1D9E75"
                            strokeWidth="2.5"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span
                            className="text-sm font-semibold"
                            style={{ color: "#1D9E75" }}
                          >
                            Holding {tokenSymbol} tokens
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={handleSubscribe}
                          disabled={subscribing}
                          className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
                          style={{
                            background: "var(--color-accent)",
                            color: "#000",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          {subscribing
                            ? "Processing..."
                            : `Buy ${tokenSymbol} Tokens · ${FAKE_TOKEN_PRICE}`}
                        </button>
                      )}

                      {/* Follow button */}
                      <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: isFollowing
                            ? "rgba(255,255,255,0.08)"
                            : "transparent",
                          border: isFollowing
                            ? "1px solid rgba(255,255,255,0.15)"
                            : "1px solid rgba(255,255,255,0.3)",
                          color: isFollowing ? "rgba(255,255,255,0.6)" : "#fff",
                          cursor: followLoading ? "not-allowed" : "pointer",
                        }}
                      >
                        {followLoading
                          ? "..."
                          : isFollowing
                            ? "Following"
                            : "+ Follow"}
                      </button>
                    </>
                  )}

                  {/* Subscribe for premium */}
                  {hasPremiumContent && !isSubscribed && user?._id !== id && (
                    <span
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      · Subscribe ₹{priceInRupees}/mo for premium content
                    </span>
                  )}
                </div>

                {subscribeError && (
                  <p className="text-sm mt-2" style={{ color: "#ef4444" }}>
                    {subscribeError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── CONTENT AREA ─────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6">
          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4">
            {/* Token card */}
            <div
              className="rounded-2xl p-4 overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(232,184,75,0.08) 0%, rgba(232,52,138,0.05) 100%)",
                border: "1px solid rgba(232,184,75,0.2)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p
                    className="font-bold text-base"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {tokenSymbol} Token
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {FAKE_TOKEN_HOLDERS} holders · {FAKE_TOKEN_SUPPLY} supply
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-xl font-bold"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {FAKE_TOKEN_PRICE}
                  </p>
                  <p className="text-xs" style={{ color: "#1D9E75" }}>
                    +12.4% ↑
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div
                className="h-1.5 rounded-full mb-3"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <div
                  className="h-1.5 rounded-full w-[62%]"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--color-accent), var(--color-pink))",
                  }}
                />
              </div>
              <p
                className="text-xs mb-3"
                style={{ color: "var(--color-text-muted)" }}
              >
                62% of tokens sold
              </p>

              {user?._id !== id ? (
                <button
                  onClick={handleSubscribe}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                  style={{
                    background: "var(--color-accent)",
                    color: "#000",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {isSubscribed
                    ? `✓ You own ${tokenSymbol} tokens`
                    : `Buy ${tokenSymbol} · ${FAKE_TOKEN_PRICE}`}
                </button>
              ) : (
                <p
                  className="text-xs text-center"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  This is your creator token
                </p>
              )}
            </div>

            {/* Wallet card */}
            {isOwnProfile && user?.walletAddress && (
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ color: "var(--color-accent)" }}
                  >
                    <rect x="2" y="6" width="20" height="14" rx="2" />
                    <path d="M16 12h2" />
                    <path d="M2 10h20" />
                  </svg>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    My Wallet
                  </p>
                  <div
                    className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(29,158,117,0.1)",
                      border: "1px solid rgba(29,158,117,0.2)",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "#1D9E75" }}
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ color: "#1D9E75" }}
                    >
                      Active
                    </span>
                  </div>
                </div>
                <p
                  className="text-xs font-mono mb-3 px-3 py-2 rounded-lg"
                  style={{
                    color: "var(--color-text-secondary)",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {user.walletAddress.slice(0, 8)}...
                  {user.walletAddress.slice(-6)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(user.walletAddress || "")}
                    className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "transparent",
                      color: copied ? "#1D9E75" : "var(--color-text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                  <button
                    onClick={exportWallet}
                    className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      border: "1px solid rgba(232,184,75,0.3)",
                      background: "rgba(232,184,75,0.06)",
                      color: "var(--color-accent)",
                      cursor: "pointer",
                    }}
                  >
                    Export ↗
                  </button>
                </div>
              </div>
            )}

            {!isOwnProfile && (
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p
                  className="text-sm font-semibold mb-1"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Ethereum Wallet
                </p>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {creator.name} has a self-custodial Ethereum wallet. All token
                  transactions are on-chain and verifiable.
                </p>
              </div>
            )}

            {/* Tabs panel */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="flex"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                {(
                  [
                    { key: "tokens", label: "Balance" },
                    { key: "transactions", label: "Activity" },
                    { key: "messages", label: "Messages" },
                  ] as { key: PanelTab; label: string }[]
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex-1 py-3 text-xs font-semibold transition-all"
                    style={{
                      background: "transparent",
                      border: "none",
                      borderBottom:
                        activeTab === tab.key
                          ? "2px solid var(--color-accent)"
                          : "2px solid transparent",
                      color:
                        activeTab === tab.key
                          ? "var(--color-text-primary)"
                          : "var(--color-text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Balance tab */}
              {activeTab === "tokens" && (
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      {
                        label: "ETH",
                        value: FAKE_ETH_BALANCE.split(" ")[0],
                        unit: "ETH",
                        color: "#627EEA",
                      },
                      {
                        label: "BF Token",
                        value: "12,400",
                        unit: "BF",
                        color: "var(--color-accent)",
                      },
                      {
                        label: "Creator",
                        value: "3,200",
                        unit: "tks",
                        color: "#a855f7",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl p-2.5 text-center"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded-full mx-auto mb-2"
                          style={{ background: item.color }}
                        />
                        <p
                          className="text-sm font-bold"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {item.value}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {item.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{
                      border: "1px solid rgba(232,184,75,0.2)",
                      background: "rgba(232,184,75,0.04)",
                      color: "var(--color-accent)",
                      cursor: "pointer",
                    }}
                  >
                    Go to BF Exchange →
                  </button>
                </div>
              )}

              {/* Transactions tab */}
              {activeTab === "transactions" && (
                <div className="p-4">
                  <div className="flex flex-col gap-1">
                    {FAKE_TRANSACTIONS.map((tx, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 py-2.5"
                        style={{
                          borderBottom:
                            i < FAKE_TRANSACTIONS.length - 1
                              ? "1px solid rgba(255,255,255,0.04)"
                              : "none",
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{
                            background: tx.amount.startsWith("+")
                              ? "rgba(29,158,117,0.12)"
                              : "rgba(239,68,68,0.12)",
                            color: tx.amount.startsWith("+")
                              ? "#1D9E75"
                              : "#ef4444",
                          }}
                        >
                          {tx.amount.startsWith("+") ? "↓" : "↑"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-xs font-medium truncate"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {tx.amount.startsWith("+")
                              ? `from @${tx.from}`
                              : `to @${tx.to}`}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {tx.time}
                          </p>
                        </div>
                        <p
                          className="text-xs font-bold flex-shrink-0"
                          style={{
                            color: tx.amount.startsWith("+")
                              ? "#1D9E75"
                              : "#ef4444",
                          }}
                        >
                          {tx.amount}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages tab */}
              {activeTab === "messages" && (
                <div className="p-4">
                  <div className="flex flex-col gap-3 mb-3">
                    {FAKE_MESSAGES.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${msg.type === "outgoing" ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            background:
                              msg.type === "incoming"
                                ? "var(--color-accent)"
                                : "rgba(255,255,255,0.08)",
                            color:
                              msg.type === "incoming"
                                ? "#000"
                                : "var(--color-text-primary)",
                          }}
                        >
                          {msg.avatar}
                        </div>
                        <div className="flex-1 max-w-[85%]">
                          <div
                            className="rounded-2xl p-3 text-xs leading-relaxed"
                            style={{
                              background:
                                msg.type === "incoming"
                                  ? "rgba(255,255,255,0.06)"
                                  : "rgba(232,184,75,0.08)",
                              border:
                                msg.type === "incoming"
                                  ? "1px solid rgba(255,255,255,0.08)"
                                  : "1px solid rgba(232,184,75,0.15)",
                              color: "var(--color-text-primary)",
                            }}
                          >
                            {msg.text}
                            {(msg as any).action && (
                              <div
                                className="mt-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                                style={{
                                  background: "var(--color-accent)",
                                  color: "#000",
                                }}
                              >
                                {(msg as any).action}
                              </div>
                            )}
                            {(msg as any).question && (
                              <p
                                className="mt-1.5"
                                style={{ color: "var(--color-text-secondary)" }}
                              >
                                {(msg as any).question}
                              </p>
                            )}
                            {(msg as any).actions && (
                              <div className="flex gap-2 mt-2">
                                {(msg as any).actions.map((a: string) => (
                                  <button
                                    key={a}
                                    className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                                    style={{
                                      border:
                                        "1px solid rgba(255,255,255,0.15)",
                                      background: "transparent",
                                      color: "var(--color-text-primary)",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {a}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <p
                            className="text-xs mt-1 px-1"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 text-xs bg-transparent outline-none"
                      style={{ color: "var(--color-text-primary)" }}
                    />
                    <button
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--color-accent)",
                        cursor: "pointer",
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* What's New — grid fills full width */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="font-bold text-lg"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  What's New
                </h2>
                <Link
                  href="/feed"
                  className="text-sm font-medium hover:opacity-70 transition-opacity"
                  style={{ color: "var(--color-accent)" }}
                >
                  See all →
                </Link>
              </div>
              {/* Grid — 4 equal columns, fills full width */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    name: creator.name,
                    initial: creatorInitial,
                    label: "LIVE",
                    color: "#ef4444",
                    sub: "Live now",
                  },
                  {
                    name: "Priya Sharma",
                    initial: "P",
                    label: "NEW",
                    color: "var(--color-accent)",
                    sub: "New release",
                  },
                  {
                    name: "Raj Verma",
                    initial: "R",
                    label: "LIVE",
                    color: "#ef4444",
                    sub: "Live now",
                  },
                  {
                    name: "Ananya Singh",
                    initial: "A",
                    label: "NEW",
                    color: "var(--color-accent)",
                    sub: "New release",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-all"
                    style={{
                      background: "var(--color-bg-surface)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      className="aspect-video flex items-center justify-center relative"
                      style={{ background: "var(--color-bg-elevated)" }}
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--color-accent), var(--color-pink))",
                          color: "#000",
                        }}
                      >
                        {item.initial}
                      </div>
                      <div
                        className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{
                          background: item.color,
                          color: "#fff",
                          fontSize: "10px",
                        }}
                      >
                        {item.label}
                      </div>
                    </div>
                    <div className="p-3">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {item.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {item.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Videos */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="font-bold text-lg"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  Videos
                  <span
                    className="font-normal text-sm ml-2"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    ({videos.length})
                  </span>
                </h2>
                {hasPremiumContent && !isSubscribed && user?._id !== id && (
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                    style={{
                      background: "var(--color-accent)",
                      color: "#000",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {subscribing ? "..." : `Subscribe ₹${priceInRupees}/mo`}
                  </button>
                )}
                {isSubscribed && user?._id !== id && (
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#1D9E75" }}
                  >
                    ✓ Subscribed
                  </span>
                )}
              </div>

              {videos.length === 0 ? (
                <div
                  className="text-center py-20 rounded-2xl border border-dashed"
                  style={{ borderColor: "rgba(255,255,255,0.07)" }}
                >
                  <p className="text-2xl mb-2">🎬</p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    No videos yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.map((video) => (
                    <VideoCard
                      key={video._id}
                      video={video}
                      isSubscribed={isSubscribed}
                      onSubscribeClick={handleSubscribe}
                    />
                  ))}
                </div>
              )}

              {subscribeError && (
                <p className="text-sm mt-4" style={{ color: "#ef4444" }}>
                  {subscribeError}
                </p>
              )}
            </div>

            {/* Share & Earn */}
            <div
              className="mt-8 rounded-2xl p-5 flex items-center justify-between gap-4"
              style={{
                background:
                  "linear-gradient(135deg, rgba(232,184,75,0.06) 0%, rgba(232,52,138,0.04) 100%)",
                border: "1px solid rgba(232,184,75,0.15)",
              }}
            >
              <div>
                <p
                  className="font-bold text-sm mb-1"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Share & Earn
                </p>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Share {creator.name}'s profile and earn BF tokens for every
                  new fan you bring
                </p>
              </div>
              <button
                onClick={() =>
                  handleCopy(`${window.location.origin}/creator/${id}`)
                }
                className="px-5 py-2.5 rounded-xl text-xs font-bold flex-shrink-0 transition-all hover:opacity-90"
                style={{
                  background: "var(--color-accent)",
                  color: "#000",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {copied ? "Copied! ✓" : "Share ↗"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
