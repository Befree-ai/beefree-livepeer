"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ICreator, IVideo } from "@/types";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePrivy } from "@privy-io/react-auth";

// ── Fake data for Web3 demo ──────────────────────────────────────────────────
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

// ── Video Card ───────────────────────────────────────────────────────────────
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
      <div className="group block rounded-xl border border-border bg-bg-surface overflow-hidden">
        <div
          className="aspect-video bg-bg-elevated flex items-center justify-center relative cursor-pointer"
          onClick={onSubscribeClick}
        >
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover opacity-40"
            />
          ) : (
            <div className="w-full h-full bg-bg-elevated opacity-40" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-bg-primary/80 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <span className="text-xs text-accent font-medium">Subscribe to watch</span>
          </div>
          <div className="absolute top-2 right-2">
            <Badge variant="premium">premium</Badge>
          </div>
        </div>
        <div className="p-3">
          <p className="font-medium text-text-secondary text-sm line-clamp-1">{video.title}</p>
          <p className="text-xs text-text-muted mt-0.5">{video.viewCount} views</p>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/video/${video._id}`} className="group block rounded-xl border border-border bg-bg-surface overflow-hidden hover:border-border-hover transition-all">
      <div className="aspect-video bg-bg-elevated flex items-center justify-center relative">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-text-muted text-xs">No thumbnail</div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={video.access === "premium" ? "premium" : "free"}>{video.access}</Badge>
        </div>
      </div>
      <div className="p-3">
        <p className="font-medium text-text-primary text-sm group-hover:text-accent transition-colors line-clamp-1">{video.title}</p>
        <p className="text-xs text-text-muted mt-0.5">{video.viewCount} views</p>
      </div>
    </Link>
  );
}

// ── Left Panel Tabs ──────────────────────────────────────────────────────────
type PanelTab = "tokens" | "transactions" | "messages";

// ── Main Page ────────────────────────────────────────────────────────────────
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

  // Load creator + videos
  useEffect(() => {
    if (!id) return;
    fetch(`/api/creators/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCreator(data.data.creator);
          setVideos(data.data.videos);
        } else {
          setError("Creator not found");
        }
      })
      .catch(() => setError("Failed to load creator"))
      .finally(() => setLoading(false));
  }, [id]);

  // Check subscription status
  useEffect(() => {
    if (!user || !id) return;
    if (user._id === id) { setIsSubscribed(true); return; }
    getAccessToken().then((token) => {
      if (!token) return;
      fetch(`/api/subscriptions?creatorId=${id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => { if (data.success) setIsSubscribed(data.data.subscribed); });
    });
  }, [user, id]);

  // Check follow status
  useEffect(() => {
    if (!user || !id || user._id === id) return;
    getAccessToken().then((token) => {
      if (!token) return;
      fetch(`/api/follow/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => { if (data.success) setIsFollowing(data.data.isFollowing); });
    });
  }, [user, id]);

  const handleSubscribe = async () => {
    if (!user) { login(); return; }
    setSubscribing(true);
    setSubscribeError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ creatorId: id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to create order");
      const { orderId, amount } = data.data;
      await loadRazorpayScript();
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency: "INR",
        name: "BeeFree",
        description: `Subscribe to ${creator?.name}`,
        order_id: orderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string; }) => {
          const verifyRes = await fetch("/api/subscriptions/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ razorpay_payment_id: response.razorpay_payment_id, razorpay_order_id: response.razorpay_order_id, razorpay_signature: response.razorpay_signature }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) { setIsSubscribed(true); setSubscribing(false); }
          else { setSubscribeError("Payment verification failed"); setSubscribing(false); }
        },
        prefill: { name: user.name || "", email: user.email || "" },
        theme: { color: "#f5e642" },
        modal: { ondismiss: () => setSubscribing(false) },
      };
      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      setSubscribeError(err instanceof Error ? err.message : "Failed to subscribe");
      setSubscribing(false);
    }
  };

  const loadRazorpayScript = (): Promise<void> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) { resolve(); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  };

  const handleFollow = async () => {
    if (!user) { login(); return; }
    setFollowLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/follow/${id}`, { method, headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.data.isFollowing);
        setCreator((prev) => prev ? { ...prev, followersCount: prev.followersCount + (isFollowing ? -1 : 1) } : prev);
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
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <p className="text-text-muted">{error || "Creator not found"}</p>
        </main>
        <Footer />
      </div>
    );
  }

  const priceInRupees = Math.round((creator as any).subscriptionPrice / 100) || 99;
  const hasPremiumContent = videos.some((v) => v.access === "premium");
  const creatorInitial = creator.name?.charAt(0)?.toUpperCase() || "?";
  const tokenSymbol = creator.name?.split(" ")[0]?.toUpperCase()?.slice(0, 4) || "BEE";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-14 w-full">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">

          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">

            {/* Profile Card */}
            <div className="rounded-2xl border border-border bg-bg-surface overflow-hidden">

              {/* Cover image */}
              <div className="h-28 relative" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #f5e642 0%, transparent 60%), radial-gradient(circle at 70% 30%, #a855f7 0%, transparent 60%)" }} />
              </div>

              {/* Hexagonal avatar */}
              <div className="px-5 pb-5">
                <div className="flex items-end justify-between -mt-10 mb-4">
                  <div className="relative">
                    {/* Hexagon clip via CSS */}
                    <div
                      className="w-20 h-20 flex items-center justify-center text-2xl font-semibold border-4 border-bg-surface"
                      style={{
                        clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
                        background: creator.avatar ? "transparent" : "var(--color-accent)",
                        color: "#000",
                      }}
                    >
                      {creator.avatar ? (
                        <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
                      ) : (
                        creatorInitial
                      )}
                    </div>
                    {creator.isVerified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--color-accent)" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Follow / Subscribe buttons */}
                  <div className="flex gap-2 mt-12">
                    {user?._id !== id && (
                      <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className="text-xs px-3 py-1.5 rounded-full border transition-all"
                        style={{
                          borderColor: isFollowing ? "var(--color-border)" : "var(--color-accent)",
                          background: isFollowing ? "transparent" : "#f5e64215",
                          color: isFollowing ? "var(--color-text-muted)" : "var(--color-accent)",
                          cursor: followLoading ? "not-allowed" : "pointer",
                        }}
                      >
                        {followLoading ? "..." : isFollowing ? "Following" : "+ Follow"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Name + handle */}
                <div className="mb-3">
                  <h1 className="font-display text-lg font-semibold text-text-primary leading-tight">
                    {creator.name}
                  </h1>
                  <p className="text-xs text-text-muted">@{creator.name?.toLowerCase().replace(/\s+/g, "")}</p>
                  {creator.bio && (
                    <p className="text-xs text-text-secondary mt-2 leading-relaxed">{creator.bio}</p>
                  )}
                </div>

                {/* Genre tags */}
                {creator.genre && creator.genre.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {creator.genre.map((g) => (
                      <span key={g} className="text-xs px-2 py-0.5 rounded-full border border-border text-text-muted">{g}</span>
                    ))}
                  </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-y border-border">
                  {[
                    { label: "Following", value: "0" },
                    { label: "Followers", value: creator.followersCount?.toString() || "0" },
                    { label: "Market Cap", value: FAKE_MARKET_CAP },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="font-semibold text-sm text-text-primary">{s.value}</p>
                      <p className="text-xs text-text-muted leading-tight">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Creator Token buy section */}
                <div className="rounded-xl border border-border p-3 mb-4" style={{ background: "var(--color-bg-elevated)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-medium text-text-primary">{tokenSymbol} Token</p>
                      <p className="text-xs text-text-muted">{FAKE_TOKEN_PRICE} · {FAKE_TOKEN_HOLDERS} holders</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-muted">Supply</p>
                      <p className="text-xs font-medium text-text-primary">{FAKE_TOKEN_SUPPLY}</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 rounded-full mb-3" style={{ background: "var(--color-border)" }}>
                    <div className="h-1 rounded-full w-[62%]" style={{ background: "var(--color-accent)" }} />
                  </div>
                  {user?._id !== id ? (
                    <button
                      onClick={handleSubscribe}
                      className="w-full py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: "var(--color-accent)", color: "#000", border: "none", cursor: "pointer" }}
                    >
                      {isSubscribed ? `✓ Holding ${tokenSymbol} tokens` : `Buy ${tokenSymbol} tokens · ${FAKE_TOKEN_PRICE}`}
                    </button>
                  ) : (
                    <p className="text-xs text-center text-text-muted">Your creator token</p>
                  )}
                  {subscribeError && <p className="text-xs text-red-400 mt-1">{subscribeError}</p>}
                </div>

                {/* Wallet section */}
                <div className="rounded-xl border border-border p-3" style={{ background: "var(--color-bg-elevated)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-text-primary flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M16 12h2"/><path d="M2 10h20"/></svg>
                      My Wallet
                    </p>
                  </div>

                  {isOwnProfile && user?.walletAddress && (
                    <div className="mb-2">
                      <p className="text-xs text-text-muted font-mono truncate mb-1.5">
                        {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopy(user.walletAddress || "")}
                          className="flex-1 py-1.5 rounded-lg text-xs border transition-all"
                          style={{ border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text-secondary)", cursor: "pointer" }}
                        >
                          {copied ? "Copied!" : "Copy address"}
                        </button>
                        <button
                          onClick={exportWallet}
                          className="flex-1 py-1.5 rounded-lg text-xs transition-all"
                          style={{ border: "1px solid var(--color-accent)", background: "#f5e64210", color: "var(--color-accent)", cursor: "pointer" }}
                        >
                          Export key ↗
                        </button>
                      </div>
                    </div>
                  )}

                  {!isOwnProfile && (
                    <p className="text-xs text-text-muted">Ethereum wallet — self custodial</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs panel — Token balance / Transactions / Messages */}
            <div className="rounded-2xl border border-border bg-bg-surface overflow-hidden">
              {/* Tab headers */}
              <div className="flex border-b border-border">
                {([
                  { key: "tokens", label: "Balance" },
                  { key: "transactions", label: "Activity" },
                  { key: "messages", label: "Messages" },
                ] as { key: PanelTab; label: string }[]).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex-1 py-2.5 text-xs font-medium transition-all"
                    style={{
                      background: "transparent",
                      border: "none",
                      borderBottom: activeTab === tab.key ? "2px solid var(--color-accent)" : "2px solid transparent",
                      color: activeTab === tab.key ? "var(--color-text-primary)" : "var(--color-text-muted)",
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
                      { label: "ETH", value: FAKE_ETH_BALANCE, color: "#627EEA" },
                      { label: "BF Token", value: FAKE_BF_BALANCE, color: "var(--color-accent)" },
                      { label: "Creator tks", value: FAKE_TOKEN_BALANCE, color: "#a855f7" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg p-2 text-center border border-border" style={{ background: "var(--color-bg-elevated)" }}>
                        <div className="w-5 h-5 rounded-full mx-auto mb-1.5" style={{ background: item.color }} />
                        <p className="text-xs font-medium text-text-primary leading-tight">{item.value.split(" ")[0]}</p>
                        <p className="text-xs text-text-muted">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    className="w-full py-2 rounded-lg text-xs font-medium transition-all"
                    style={{ border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text-secondary)", cursor: "pointer" }}
                  >
                    Go to BF Exchange →
                  </button>
                </div>
              )}

              {/* Transactions tab */}
              {activeTab === "transactions" && (
                <div className="p-4">
                  <div className="flex flex-col gap-2">
                    {FAKE_TRANSACTIONS.map((tx, i) => (
                      <div key={i} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                          style={{ background: tx.amount.startsWith("+") ? "#1D9E7520" : "#ef444420", color: tx.amount.startsWith("+") ? "#1D9E75" : "#ef4444" }}>
                          {tx.amount.startsWith("+") ? "↓" : "↑"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text-primary truncate">
                            {tx.amount.startsWith("+") ? `from @${tx.from}` : `to @${tx.to}`}
                          </p>
                          <p className="text-xs text-text-muted">{tx.time}</p>
                        </div>
                        <p className="text-xs font-medium flex-shrink-0" style={{ color: tx.amount.startsWith("+") ? "#1D9E75" : "#ef4444" }}>
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
                      <div key={msg.id} className={`flex gap-2 ${msg.type === "outgoing" ? "flex-row-reverse" : ""}`}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                          style={{ background: msg.type === "incoming" ? "var(--color-accent)" : "var(--color-bg-elevated)", color: msg.type === "incoming" ? "#000" : "var(--color-text-primary)" }}>
                          {msg.avatar}
                        </div>
                        <div className="flex-1 max-w-[80%]">
                          <div className="rounded-xl p-2.5 text-xs"
                            style={{ background: msg.type === "incoming" ? "var(--color-bg-elevated)" : "#f5e64215", border: "1px solid var(--color-border)" }}>
                            {msg.text}
                            {msg.action && (
                              <div className="mt-1.5 px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "var(--color-accent)", color: "#000" }}>
                                {msg.action}
                              </div>
                            )}
                            {msg.question && <p className="text-text-muted mt-1">{msg.question}</p>}
                            {msg.actions && (
                              <div className="flex gap-2 mt-1.5">
                                {msg.actions.map((a) => (
                                  <button key={a} className="flex-1 py-1 rounded-lg text-xs border" style={{ border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text-secondary)", cursor: "pointer" }}>{a}</button>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-text-muted mt-0.5 px-1">{msg.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Message input */}
                  <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2" style={{ background: "var(--color-bg-elevated)" }}>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 text-xs bg-transparent outline-none text-text-primary placeholder:text-text-muted"
                    />
                    <button style={{ background: "transparent", border: "none", color: "var(--color-accent)", cursor: "pointer" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Live streams row */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-base font-semibold text-text-primary">What's New</h2>
                <Link href="/feed" className="text-xs text-accent hover:underline">See all →</Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                {[
                  { name: creator.name, initial: creatorInitial, label: "LIVE", color: "#ef4444" },
                  { name: "Priya Sharma", initial: "P", label: "NEW", color: "var(--color-accent)" },
                  { name: "Raj Verma", initial: "R", label: "LIVE", color: "#ef4444" },
                  { name: "Ananya Singh", initial: "A", label: "NEW", color: "var(--color-accent)" },
                ].map((item, i) => (
                  <div key={i} className="flex-shrink-0 w-32 rounded-xl border border-border overflow-hidden cursor-pointer hover:border-border-hover transition-all" style={{ background: "var(--color-bg-surface)" }}>
                    <div className="aspect-video flex items-center justify-center relative" style={{ background: "var(--color-bg-elevated)" }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: "var(--color-accent)", color: "#000" }}>{item.initial}</div>
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: item.color, color: "#fff", fontSize: "9px" }}>{item.label}</div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-text-primary font-medium truncate">{item.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Videos grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-base font-semibold text-text-primary">
                  Videos
                  <span className="text-text-muted font-normal text-sm ml-2">({videos.length})</span>
                </h2>
                {hasPremiumContent && !isSubscribed && user?._id !== id && (
                  <Button variant="primary" size="sm" onClick={handleSubscribe} loading={subscribing}>
                    Subscribe ₹{priceInRupees}/mo
                  </Button>
                )}
                {isSubscribed && user?._id !== id && (
                  <span className="text-xs text-green-400 font-medium">✓ Subscribed</span>
                )}
              </div>

              {videos.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-xl">
                  <p className="text-text-muted text-sm">No videos yet</p>
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
                <p className="text-sm text-red-400 mt-4">{subscribeError}</p>
              )}
            </div>

            {/* Share & Earn section */}
            <div className="mt-8 rounded-xl border border-border p-4 flex items-center justify-between" style={{ background: "var(--color-bg-surface)" }}>
              <div>
                <p className="text-sm font-medium text-text-primary mb-0.5">Share & Earn</p>
                <p className="text-xs text-text-muted">Share {creator.name}'s profile and earn BF tokens for every new fan you bring</p>
              </div>
              <button
                onClick={() => handleCopy(`${window.location.origin}/creator/${id}`)}
                className="ml-4 px-4 py-2 rounded-lg text-xs font-semibold flex-shrink-0 transition-all"
                style={{ background: "var(--color-accent)", color: "#000", border: "none", cursor: "pointer" }}
              >
                {copied ? "Copied!" : "Share ↗"}
              </button>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}