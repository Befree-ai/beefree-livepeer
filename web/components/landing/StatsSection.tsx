"use client";

import FadeUp from "@/components/ui/FadeUp";
import Counter from "@/components/ui/Counter";

const STATS = [
  {
    value: 95,
    suffix: "%",
    label: "Revenue to creators",
    sub: "vs 55% on YouTube · 20% with labels",
  },
  {
    value: 0,
    prefix: "₹",
    suffix: "",
    label: "Taken by middlemen",
    sub: "Direct creator-to-fan payments",
  },
  {
    value: 100,
    suffix: "%",
    label: "Content ownership",
    sub: "Stored on decentralised infrastructure",
  },
];

export default function StatsSection() {
  return (
    <section
      className="py-24 border-b"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATS.map((s, i) => (
            <FadeUp key={s.label} delay={i * 0.1}>
              <div
                className="p-8 rounded-2xl"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <p
                  className="text-5xl md:text-6xl font-bold mb-2"
                  style={{
                    color: "var(--color-accent)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  <Counter
                    to={s.value}
                    prefix={s.prefix || ""}
                    suffix={s.suffix}
                  />
                </p>
                <p
                  className="font-semibold mb-1"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {s.label}
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {s.sub}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
