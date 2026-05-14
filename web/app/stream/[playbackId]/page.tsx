"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import * as Player from "@livepeer/react/player";
import { getSrc } from "@livepeer/react/external";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { usePrivy } from "@privy-io/react-auth";
import FadeUp from "@/components/ui/FadeUp";

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
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  useEffect(() => {
    if (!playbackId) return;
    fetch(`/api/streams?playbackId=${playbackId}`)
      .then(r => r.json())
      .then(async streamData => {
        const stream = streamData.data?.stream;
        if (stream?.access === "premium") {
          setCreatorId(stream.creator?._id || stream.creator);
          setCreatorName(stream.creator?.name || "this creator");
          setPrice(stream.creator?.subscriptionPrice || 9900);
          if (!user) { setIsLocked(true); setLoading(false); return; }
          const token = await getAccessToken();
          if (!token) { setIsLocked(true); setLoading(false); return; }
          const creatorIdToCheck = stream.creator?._id || stream.creator;
          const subRes = await fetch(`/api/subscriptions?creatorId=${creatorIdToCheck}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const subData = await subRes.json();
          const subscribed = subData.data?.subscribed || false;
          const isCreator = user._id.toString() === stream.creator?._id?.toString();
          if (!subscribed && !isCreator) { setIsLocked(true); setLoading(false); return; }
          setIsLocked(false);
        }
        const playbackRes = await fetch(`/api/playback/${playbackId}`);
        const playbackData = await playbackRes.json();
        if (playbackData.success) setSrc(getSrc(playbackData.data.playbackInfo));
        else setError("Stream not found");
      })
      .catch(() => {
        fetch(`/api/playback/${playbackId}`)
          .then(r => r.json())
          .then(data => {
            if (data.success) setSrc(getSrc(data.data.playbackInfo));
            else setError("Stream not found");
          })
          .catch(() => setError("Failed to load stream"));
      })
      .finally(() => setLoading(false));
  }, [playbackId, user]);

  const handleSubscribe = async () => {
    if (!user) { login(); return; }
    if (!creatorId) return;
    setSubscribing(true);
    setSubscribeError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ creatorId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to create order");
      const { orderId, amount } = data.data;
      await loadRazorpayScript();
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount, currency: "INR", name: "BeeFree",
        description: `Subscribe to ${creatorName}`,
        order_id: orderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch("/api/subscriptions/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ razorpay_payment_id: response.razorpay_payment_id, razorpay_order_id: response.razorpay_order_id, razorpay_signature: response.razorpay_signature }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setIsLocked(false);
            const playbackRes = await fetch(`/api/playback/${playbackId}`);
            const playbackData = await playbackRes.json();
            if (playbackData.success) setSrc(getSrc(playbackData.data.playbackInfo));
            setSubscribing(false);
          } else { setSubscribeError("Payment verification failed"); setSubscribing(false); }
        },
        prefill: { name: user.name || "", email: user.email || "" },
        theme: { color: "#E8B84B" },
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
    return new Promise(resolve => {
      if ((window as any).Razorpay) { resolve(); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js"\;
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg-primary)" }}>
      <Navbar />
      <main className="flex-1 pt-16 w-full">
        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* Header */}
          <FadeUp>
            <div className="flex items-center gap-3 mb-6">
              <h1 className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
                Live Stream
              </h1>
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: "rgba(232,52,138,0.12)",
                  border: "1px solid rgba(232,52,138,0.3)",
                  color: "var(--color-pink)",
                }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--color-pink)" }} />
                LIVE
              </span>
            </div>
          </FadeUp>

          {/* Player area */}
          <FadeUp delay={0.05}>
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "#000", border: "1px solid rgba(255,255,255,0.08)" }}>

              {loading ? (
                <div className="aspect-video flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
                </div>

              ) : isLocked ? (
                <div className="aspect-video flex flex-col items-center justify-center gap-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(232,184,75,0.1)", border: "1px solid rgba(232,184,75,0.2)" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2"
                      style={{ color: "var(--color-accent)" }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg mb-1"
                      style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
                      Premium Live Stream
                    </p>
                    <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
                      Subscribe to watch {creatorName} live
                    </p>
                    {subscribeError && (
                      <p className="text-sm mb-3" style={{ color: "#ef4444" }}>{subscribeError}</p>
                    )}
                    <button
                      onClick={handleSubscribe}
                      disabled={subscribing}
                      className="px-8 py-3 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: subscribing ? "rgba(232,184,75,0.3)" : "var(--color-accent)",
                        color: "#000", border: "none",
                        cursor: subscribing ? "not-allowed" : "pointer",
                      }}>
                      {subscribing ? "Processing..." : `Subscribe ₹${Math.round(price / 100)}/month`}
                    </button>
                  </div>
                </div>

              ) : error || !src ? (
                <div className="aspect-video flex items-center justify-center">
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    {error || "Stream is offline"}
                  </p>
                </div>

              ) : (
                <Player.Root src={src} autoPlay lowLatency>
                  <Player.Container style={{ width: "100%", aspectRatio: "16/9", position: "relative", backgroundColor: "black" }}>
                    <Player.Video style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    <Player.Controls style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: "linear-gradient(transparent, rgba(0,0,0,0.8))", display: "flex", alignItems: "center", gap: 12 }}>
                      <Player.MuteTrigger style={{ background: "transparent", border: "none", cursor: "pointer", color: "white", fontSize: 16 }}>
                        <Player.VolumeIndicator asChild matcher={false}><span>🔇</span></Player.VolumeIndicator>
                        <Player.VolumeIndicator asChild matcher={true}><span>🔊</span></Player.VolumeIndicator>
                      </Player.MuteTrigger>
                      <div style={{ flex: 1 }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                        <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>LIVE</span>
                      </div>
                      <Player.FullscreenTrigger style={{ background: "transparent", border: "none", cursor: "pointer", color: "white" }}>
                        <Player.FullscreenIndicator asChild matcher={false}><span>⛶</span></Player.FullscreenIndicator>
                        <Player.FullscreenIndicator asChild><span>✕</span></Player.FullscreenIndicator>
                      </Player.FullscreenTrigger>
                    </Player.Controls>
                  </Player.Container>
                </Player.Root>
              )}
            </div>
          </FadeUp>

        </div>
      </main>
    </div>
  );
}
