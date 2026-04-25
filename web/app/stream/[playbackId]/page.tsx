"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import * as Player from "@livepeer/react/player";
import { getSrc } from "@livepeer/react/external";
import Navbar from "@/components/layout/Navbar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { usePrivy } from "@privy-io/react-auth";

export default function StreamViewerPage() {
  const params = useParams();
  const playbackId = params?.playbackId as string;
  const { user } = useAuth();
  const { getAccessToken, login } = usePrivy();

  const [src, setSrc] = useState<ReturnType<typeof getSrc>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState<string>("");
  const [price, setPrice] = useState<number>(9900);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  useEffect(() => {
    if (!playbackId) return;

    // 1. Get stream info from our DB to check if premium
    fetch(`/api/streams?playbackId=${playbackId}`)
      .then((r) => r.json())
      .then(async (streamData) => {
        const stream = streamData.data?.stream;

        // 2. If premium stream — check subscription
        if (stream?.access === "premium") {
          setCreatorId(stream.creator?._id || stream.creator);
          setCreatorName(stream.creator?.name || "this creator");
          setPrice(stream.creator?.subscriptionPrice || 9900);

          if (!user) {
            // Not logged in — show lock
            setIsLocked(true);
            setLoading(false);
            return;
          }

          const token = await getAccessToken();
          if (!token) {
            setIsLocked(true);
            setLoading(false);
            return;
          }

          const creatorIdToCheck = stream.creator?._id || stream.creator;

          const subRes = await fetch(
            `/api/subscriptions?creatorId=${creatorIdToCheck}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const subData = await subRes.json();
          const subscribed = subData.data?.subscribed || false;
          setIsSubscribed(subscribed);

          // Check if viewer IS the creator
          const isCreator =
            user._id.toString() === stream.creator?._id?.toString();

          if (!subscribed && !isCreator) {
            setIsLocked(true);
            setLoading(false);
            return;
          }

          // Subscribed or is creator — allow through
          setIsLocked(false);
        }

        // 3. Load playback src
        const playbackRes = await fetch(`/api/playback/${playbackId}`);
        const playbackData = await playbackRes.json();
        if (playbackData.success) {
          setSrc(getSrc(playbackData.data.playbackInfo));
        } else {
          setError("Stream not found");
        }
      })
      .catch(() => {
        // If stream API fails just try to load playback directly (free stream)
        fetch(`/api/playback/${playbackId}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.success) setSrc(getSrc(data.data.playbackInfo));
            else setError("Stream not found");
          })
          .catch(() => setError("Failed to load stream"));
      })
      .finally(() => setLoading(false));
  }, [playbackId, user]);

  const handleSubscribe = async () => {
    if (!user) {
      login();
      return;
    }
    if (!creatorId) return;

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
        body: JSON.stringify({ creatorId }),
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
        description: `Subscribe to ${creatorName}`,
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
            setIsLocked(false);
            // Reload stream
            const playbackRes = await fetch(`/api/playback/${playbackId}`);
            const playbackData = await playbackRes.json();
            if (playbackData.success)
              setSrc(getSrc(playbackData.data.playbackInfo));
            setSubscribing(false);
          } else {
            setSubscribeError("Payment verification failed");
            setSubscribing(false);
          }
        },
        prefill: { name: user.name || "", email: user.email || "" },
        theme: { color: "#f5e642" },
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 w-full">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="font-display text-2xl font-semibold text-text-primary">
              Live Stream
            </h1>
            <Badge variant="live">Live</Badge>
          </div>

          <div
            className="rounded-xl overflow-hidden border border-border"
            style={{ background: "#000" }}
          >
            {loading ? (
              <div className="aspect-video flex items-center justify-center">
                <div
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{
                    borderColor: "#f5e642",
                    borderTopColor: "transparent",
                  }}
                />
              </div>
            ) : isLocked ? (
              <div className="aspect-video flex flex-col items-center justify-center gap-4">
                <div className="w-14 h-14 rounded-full bg-bg-elevated flex items-center justify-center">
                  <svg
                    width="24"
                    height="24"
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
                <p className="text-text-primary font-medium">
                  Premium Live Stream
                </p>
                <p className="text-text-muted text-sm">
                  Subscribe to watch this stream
                </p>
                {subscribeError && (
                  <p className="text-red-400 text-sm">{subscribeError}</p>
                )}
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSubscribe}
                  loading={subscribing}
                >
                  Subscribe ₹{Math.round(price / 100)}/month
                </Button>
              </div>
            ) : error || !src ? (
              <div className="aspect-video flex items-center justify-center">
                <p className="text-text-muted text-sm">
                  {error || "Stream is offline"}
                </p>
              </div>
            ) : (
              <Player.Root src={src} autoPlay lowLatency>
                <Player.Container
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    position: "relative",
                    backgroundColor: "black",
                  }}
                >
                  <Player.Video
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                  <Player.Controls
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
                    <Player.MuteTrigger
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "white",
                        fontSize: 16,
                      }}
                    >
                      <Player.VolumeIndicator asChild matcher={false}>
                        <span>🔇</span>
                      </Player.VolumeIndicator>
                      <Player.VolumeIndicator asChild matcher={true}>
                        <span>🔊</span>
                      </Player.VolumeIndicator>
                    </Player.MuteTrigger>
                    <div style={{ flex: 1 }} />
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#ef4444",
                        }}
                      />
                      <span style={{ color: "white", fontSize: 12 }}>LIVE</span>
                    </div>
                    <Player.FullscreenTrigger
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "white",
                      }}
                    >
                      <Player.FullscreenIndicator asChild matcher={false}>
                        <span>⛶</span>
                      </Player.FullscreenIndicator>
                      <Player.FullscreenIndicator asChild>
                        <span>✕</span>
                      </Player.FullscreenIndicator>
                    </Player.FullscreenTrigger>
                  </Player.Controls>
                </Player.Container>
              </Player.Root>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
