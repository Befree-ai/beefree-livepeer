"use client";

import FadeUp from "@/components/ui/FadeUp";
import VideoPlaceholder from "@/components/ui/VideoPlaceholder";

const FEATURES = [
  "Video Upload",
  "Livestreaming",
  "Premium Content",
  "Direct Payments",
  "Creator Wallet",
  "Fan Subscriptions",
  "Creator Tokens",
];

export default function PlatformPreview() {
  return (
    <section
      className="py-24 border-b"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeUp>
          <div className="text-center mb-12">
            <p
              className="text-xs font-semibold tracking-widest mb-3 uppercase"
              style={{ color: "var(--color-accent)" }}
            >
              The platform
            </p>
            <h2
              className="text-3xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              See BeeFree in action.
            </h2>
            <p
              className="text-lg max-w-xl mx-auto"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Upload music, go live, earn directly. Everything a creator
              needs — built for India.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.15}>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {/* Replace VideoPlaceholder with actual <video> tag when ready */}
            <VideoPlaceholder label="Platform demo video · 1920×1080 · MP4" />
          </div>
        </FadeUp>

        <FadeUp delay={0.25}>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {FEATURES.map((f) => (
              <span
                key={f}
                className="px-4 py-2 rounded-full text-sm"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
