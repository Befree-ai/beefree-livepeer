"use client";

import { motion } from "framer-motion";

const GENRES = [
  { text: "Bollywood", accent: true },
  { text: "Indie", accent: false },
  { text: "Hip-Hop", accent: false },
  { text: "Classical", accent: true },
  { text: "Electronic", accent: false },
  { text: "Sufi", accent: true },
  { text: "Folk", accent: false },
  { text: "Ghazal", accent: false },
  { text: "Fusion", accent: true },
  { text: "Jazz", accent: false },
  { text: "Rock", accent: false },
  { text: "Devotional", accent: true },
  { text: "Instrumental", accent: false },
  { text: "Lo-Fi", accent: false },
  { text: "Punjabi", accent: true },
];

export default function MarqueeStrip() {
  return (
    <div
      className="relative border-t border-b"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}
    >
      <div
        className="relative overflow-hidden py-4"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <motion.div
          className="flex gap-8 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
          style={{ width: "max-content" }}
        >
          {[...GENRES, ...GENRES].map((g, i) => (
            <span
              key={i}
              className="text-sm font-medium tracking-wide"
              style={{
                color: g.accent
                  ? "var(--color-accent)"
                  : "var(--color-text-muted)",
              }}
            >
              {g.text}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
