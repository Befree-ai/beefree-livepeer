"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import FadeUp from "@/components/ui/FadeUp";

const PLATFORMS = [
  { label: "Labels", creatorGets: 20, delay: 0 },
  { label: "Spotify", creatorGets: 30, delay: 0.1 },
  { label: "YouTube", creatorGets: 55, delay: 0.2 },
  { label: "Patreon", creatorGets: 88, delay: 0.3 },
  { label: "BeeFree", creatorGets: 92, delay: 0.4 },
];

function RevenueBar({
  label,
  creatorGets,
  delay,
}: {
  label: string;
  creatorGets: number;
  delay: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const isBeeFree = label === "BeeFree";

  return (
    <div ref={ref} className="flex items-center gap-4">
      <p
        className="text-sm w-20 flex-shrink-0 text-right font-medium"
        style={{
          color: isBeeFree
            ? "var(--color-accent)"
            : "var(--color-text-muted)",
        }}
      >
        {label}
      </p>
      <div
        className="flex-1 h-9 rounded-lg overflow-hidden"
        style={{ background: "rgba(255,255,255,0.04)" }}
      >
        <motion.div
          className="h-full rounded-lg flex items-center px-3"
          initial={{ width: 0 }}
          animate={inView ? { width: `${creatorGets}%` } : {}}
          transition={{
            duration: 1.2,
            delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{
            background: isBeeFree
              ? "linear-gradient(90deg, rgba(232,184,75,0.7), rgba(232,184,75,1))"
              : "rgba(255,255,255,0.07)",
          }}
        >
          <span
            className="text-xs font-semibold"
            style={{
              color: isBeeFree ? "#000" : "var(--color-text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            {creatorGets}% to creator
          </span>
        </motion.div>
      </div>
    </div>
  );
}

export default function RevenueComparison() {
  return (
    <section
      className="py-24 border-b"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <FadeUp>
            <div>
              <p
                className="text-xs font-semibold tracking-widest mb-3 uppercase"
                style={{ color: "var(--color-accent)" }}
              >
                The problem
              </p>
              <h2
                className="text-3xl md:text-4xl font-bold mb-6"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Big tech makes you the product.
              </h2>
              <p
                className="text-lg mb-4 leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Labels take up to 80% of your earnings. YouTube keeps 45%.
                Spotify pays fractions of a cent per stream. Your audience
                belongs to the platform — not to you.
              </p>
              <p
                className="leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                BeeFree changes this. Fans pay you directly via UPI or crypto.
                You keep 92%. Your content lives on decentralised
                infrastructure — nobody can take it down or silence you.
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={0.15}>
            <div className="flex flex-col gap-4">
              {PLATFORMS.map((item) => (
                <RevenueBar key={item.label} {...item} />
              ))}
              <p
                className="text-xs mt-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                * BeeFree takes 5–8%. Razorpay payment processing ~2%.
              </p>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
