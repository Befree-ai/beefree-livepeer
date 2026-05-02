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
        {/* Thumbnail — visible but locked */}
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
          {/* Lock overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-bg-primary/80 flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-accent"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <span className="text-xs text-accent font-medium">
              Subscribe to watch
            </span>
          </div>
          <div className="absolute top-2 right-2">
            <Badge variant="premium">premium</Badge>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="font-medium text-text-secondary text-sm line-clamp-2">
            {video.title}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {video.viewCount} views
          </p>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/video/${video._id}`}
      className="group block rounded-xl border border-border bg-bg-surface overflow-hidden hover:border-border-hover transition-all"
    >
      <div className="aspect-video bg-bg-elevated flex items-center justify-center relative">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-text-muted text-sm">No thumbnail</div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={video.access === "premium" ? "premium" : "free"}>
            {video.access}
          </Badge>
        </div>
      </div>
      <div className="p-4">
        <p className="font-medium text-text-primary text-sm group-hover:text-accent transition-colors line-clamp-2">
          {video.title}
        </p>
        <p className="text-xs text-text-muted mt-1">{video.viewCount} views</p>
      </div>
    </Link>
  );
}

export default function CreatorProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const { getAccessToken, login } = usePrivy();

  const [creator, setCreator] = useState<ICreator | null>(null);
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

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

    // Creator doesn't need to subscribe to their own content
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

  // Check follow status
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
    // If not logged in — prompt login first
    if (!user) {
      login();
      return;
    }

    setSubscribing(true);
    setSubscribeError(null);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");

      // Step 1: Create order on our backend
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

      // Step 2: Load Razorpay checkout script dynamically
      await loadRazorpayScript();

      // Step 3: Open Razorpay checkout
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
          // Step 4: Verify payment on our backend
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
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: {
          color: "#f5e642",
        },
        modal: {
          ondismiss: () => {
            setSubscribing(false);
          },
        },
      };

      // @ts-ignore — Razorpay is loaded via script tag
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      setSubscribeError(
        err instanceof Error ? err.message : "Failed to subscribe",
      );
      setSubscribing(false);
    }
  };

  // Load Razorpay script dynamically
  const loadRazorpayScript = (): Promise<void> => {
    return new Promise((resolve) => {
      // Already loaded
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
        // Update follower count in UI
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 max-w-6xl mx-auto px-6 py-12 w-full">
          <div className="animate-pulse">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-bg-elevated" />
              <div>
                <div className="h-6 bg-bg-elevated rounded w-48 mb-2" />
                <div className="h-4 bg-bg-elevated rounded w-32" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-bg-surface"
                >
                  <div className="aspect-video bg-bg-elevated" />
                  <div className="p-4">
                    <div className="h-4 bg-bg-elevated rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
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

  const priceInRupees =
    Math.round((creator as any).subscriptionPrice / 100) || 99;
  const hasPremiumContent = videos.some((v) => v.access === "premium");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16 w-full">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Creator Header */}
          <div className="flex items-start gap-6 mb-10 pb-10 border-b border-border">
            <div className="w-24 h-24 rounded-full bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0">
              {creator.avatar ? (
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-3xl font-semibold text-text-secondary">
                  {creator.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="font-display text-3xl font-semibold text-text-primary">
                  {creator.name}
                </h1>
                {creator.isVerified && (
                  <Badge variant="verified">Verified</Badge>
                )}
              </div>

              <div className="flex items-center gap-3 mb-3">
                <p className="text-text-muted text-sm">
                  {creator.followersCount} followers
                </p>
                {/* Don't show follow button on own profile */}
                {user?._id !== id && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className="text-xs px-3 py-1 rounded-full border transition-all"
                    style={{
                      borderColor: isFollowing
                        ? "var(--color-border)"
                        : "var(--color-accent)",
                      background: isFollowing ? "transparent" : "#f5e64215",
                      color: isFollowing
                        ? "var(--color-text-muted)"
                        : "var(--color-accent)",
                      cursor: followLoading ? "not-allowed" : "pointer",
                      opacity: followLoading ? 0.6 : 1,
                    }}
                  >
                    {followLoading
                      ? "..."
                      : isFollowing
                        ? "Following"
                        : "+ Follow"}
                  </button>
                )}
              </div>

              {creator.bio && (
                <p className="text-text-secondary text-sm max-w-xl mb-4">
                  {creator.bio}
                </p>
              )}

              {creator.genre && creator.genre.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {creator.genre.map((g) => (
                    <span
                      key={g}
                      className="text-xs px-2.5 py-1 rounded-full border border-border text-text-muted"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Subscribe button */}
              {hasPremiumContent && (
                <div className="flex flex-col gap-2">
                  {isSubscribed ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-400 font-medium">
                        ✓ Subscribed
                      </span>
                      <span className="text-xs text-text-muted">
                        Premium content unlocked
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleSubscribe}
                        loading={subscribing}
                      >
                        Subscribe ₹{priceInRupees}/month
                      </Button>
                      <span className="text-xs text-text-muted">
                        Unlock all premium content
                      </span>
                    </div>
                  )}
                  {subscribeError && (
                    <p className="text-sm text-red-400">{subscribeError}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Videos */}
          <div>
            <h2 className="font-display text-2xl font-semibold text-text-primary mb-6">
              Videos
            </h2>

            {videos.length === 0 ? (
              <div className="text-center py-16 border border-border rounded-xl">
                <p className="text-text-muted text-sm">No videos yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
