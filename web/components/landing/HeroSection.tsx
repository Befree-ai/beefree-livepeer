"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ImgPlaceholder from "@/components/ui/ImgPlaceholder";

// Animated orb background — pure CSS, no library
function OrbBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(232,184,75,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,184,75,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "700px",
          height: "700px",
          top: "-250px",
          right: "-150px",
          background:
            "radial-gradient(circle, rgba(232,184,75,0.10) 0%, transparent 65%)",
          filter: "blur(50px)",
          animation: "orb1 9s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "500px",
          height: "500px",
          bottom: "-150px",
          left: "-80px",
          background:
            "radial-gradient(circle, rgba(232,52,138,0.08) 0%, transparent 65%)",
          filter: "blur(50px)",
          animation: "orb2 11s ease-in-out infinite alternate",
        }}
      />
    </div>
  );
}

interface HeroSectionProps {
  authenticated: boolean;
  onLogin: () => void;
}

export default function HeroSection({
  authenticated,
  onLogin,
}: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-14 overflow-hidden">
      <OrbBackground />

      <div className="relative max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
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
              Decentralised Creator Network · India
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.1,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="text-5xl md:text-7xl font-bold mb-6 leading-none tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Power back
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #E8B84B 0%, #E8348A 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                to the people.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="text-lg mb-10 max-w-lg leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              LyveFree is India's first decentralised creator network. Upload
              music, go live, earn directly from your fans. No labels. No
              YouTube cuts. No middlemen.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="flex items-center gap-4 flex-wrap mb-12"
            >
              {authenticated ? (
                <Link href="/feed">
                  <button
                    className="px-8 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                    style={{
                      background: "var(--color-accent)",
                      color: "#000",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Go to feed →
                  </button>
                </Link>
              ) : (
                <>
                  <button
                    onClick={onLogin}
                    className="px-8 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                    style={{
                      background: "var(--color-accent)",
                      color: "#000",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Join LyveFree free →
                  </button>
                  <Link href="/explore">
                    <button
                      className="px-8 py-3.5 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "var(--color-text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      Explore creators
                    </button>
                  </Link>
                </>
              )}
            </motion.div>

            {/* Early access badge — honest */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "var(--color-pink)" }}
              />
              <p
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Now in early access · India ·{" "}
                <span style={{ color: "var(--color-text-secondary)" }}>
                  Be among the first
                </span>
              </p>
            </motion.div>
          </div>

          {/* Right — creator card demo */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.9,
              delay: 0.2,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="relative hidden lg:block"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                background: "var(--color-bg-surface)",
              }}
            >
              {/* Replace with real creator cover photo */}
              <img
                src="/landing/hero-cover.jpg"
                alt="Creator cover"
                className="w-full h-full object-cover"
                style={{ aspectRatio: "3/1" }}
              />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                      style={{
                        background: "rgba(232,184,75,0.1)",
                        border: "1px solid rgba(232,184,75,0.2)",
                      }}
                    >
                      🎵
                    </div>
                    <div>
                      <p
                        className="font-semibold text-sm"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        Golshifteh Farahani
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        @golfarhani · Hollywood · Actress
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-xs mb-0.5"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Market Cap
                    </p>
                    <p
                      className="text-sm font-bold"
                      style={{ color: "var(--color-accent)" }}
                    >
                      $10M
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "Followers", value: "15.6M" },
                    { label: "Tokens", value: "1M" },
                    { label: "Token Price", value: "$10" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="text-center py-2 rounded-lg"
                      style={{ background: "var(--color-bg-elevated)" }}
                    >
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {s.value}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  className="w-full py-2.5 rounded-xl text-xs font-semibold"
                  style={{
                    background: "var(--color-accent)",
                    color: "#000",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  This could be your profile
                </button>
              </div>
            </div>

            {/* Floating — payment */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -bottom-5 -left-8 px-4 py-3 rounded-xl flex items-center gap-3"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  background: "rgba(29,158,117,0.15)",
                  color: "#1D9E75",
                }}
              >
                ₹
              </div>
              <div>
                <p
                  className="text-xs font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Direct payment
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Fan → Creator · No middleman
                </p>
              </div>
            </motion.div>

            {/* Floating — live */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute -top-4 -right-6 px-3 py-2 rounded-xl flex items-center gap-2"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "var(--color-pink)" }}
              />
              <p
                className="text-xs font-semibold"
                style={{ color: "var(--color-pink)" }}
              >
                Live streaming
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
