"use client";

import Link from "next/link";
import FadeUp from "@/components/ui/FadeUp";

interface FinalCTAProps {
  onLogin: () => void;
}

export default function FinalCTA({ onLogin }: FinalCTAProps) {
  return (
    <section className="py-32">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <FadeUp>
          <div className="relative">
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(232,184,75,0.07) 0%, transparent 70%)",
              }}
            />
            <div
              className="relative p-12 md:p-20 rounded-3xl"
              style={{
                border: "1px solid rgba(232,184,75,0.12)",
                background: "rgba(232,184,75,0.02)",
              }}
            >
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-8"
                style={{
                  background: "rgba(232,184,75,0.08)",
                  border: "1px solid rgba(232,184,75,0.2)",
                  color: "var(--color-accent)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "var(--color-accent)" }}
                />
                Early access · India
              </span>

              <h2
                className="text-4xl md:text-6xl font-bold mb-6"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Be free.
              </h2>

              <p
                className="text-lg mb-10 max-w-md mx-auto"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Join the creators and fans building India's first
                decentralised creator network — where the community
                co-owns and earns from the network.
              </p>

              <div className="flex items-center justify-center gap-4 flex-wrap">
                <button
                  onClick={onLogin}
                  className="px-10 py-4 rounded-xl text-base font-semibold transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background: "var(--color-accent)",
                    color: "#000",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Join BeeFree free →
                </button>
                <Link href="/apply">
                  <button
                    className="px-10 py-4 rounded-xl text-base font-medium transition-all"
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "var(--color-text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    Apply as creator
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
