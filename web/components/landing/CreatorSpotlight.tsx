"use client";

import Link from "next/link";
import FadeUp from "@/components/ui/FadeUp";
import ImgPlaceholder from "@/components/ui/ImgPlaceholder";

const GENRES = [
  { genre: "Bollywood · Indie" },
  { genre: "Hip-Hop · Electronic" },
  { genre: "Classical · Fusion" },
  { genre: "Sufi · Ghazal" },
];

export default function CreatorSpotlight() {
  return (
    <section
      className="py-24 border-b"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeUp>
          <div className="flex items-end justify-between mb-12">
            <div>
              <p
                className="text-xs font-semibold tracking-widest mb-3 uppercase"
                style={{ color: "var(--color-accent)" }}
              >
                Creators
              </p>
              <h2
                className="text-3xl md:text-4xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Your stage is waiting.
              </h2>
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                We're inviting India's most creative artists to join first.
              </p>
            </div>
            <Link
              href="/apply"
              className="text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ color: "var(--color-accent)" }}
            >
              Apply to join →
            </Link>
          </div>
        </FadeUp>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GENRES.map((c, i) => (
            <FadeUp key={i} delay={i * 0.08}>
              <div
                className="rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform"
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "var(--color-bg-surface)",
                }}
              >
                {/* Replace with real creator photo when ready */}
                <ImgPlaceholder
                  label="Creator photo · 400×400px"
                  aspect="aspect-square"
                />
                <div className="p-3">
                  <p
                    className="font-semibold text-sm"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Coming soon
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {c.genre}
                  </p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.3}>
          <div
            className="mt-8 p-6 rounded-2xl flex items-center justify-between flex-wrap gap-4"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div>
              <p
                className="font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Are you a creator?
              </p>
              <p
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                Apply to join BeeFree early access and start earning
                directly from your fans.
              </p>
            </div>
            <Link href="/apply">
              <button
                className="px-6 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all hover:opacity-90"
                style={{
                  background: "var(--color-accent)",
                  color: "#000",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Apply to become a creator →
              </button>
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
