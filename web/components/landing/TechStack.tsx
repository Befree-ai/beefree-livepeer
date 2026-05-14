"use client";

import FadeUp from "@/components/ui/FadeUp";

const STACK = [
  {
    name: "Livepeer",
    role: "Decentralised video infrastructure",
    desc: "All video on BeeFree is stored and streamed via Livepeer — a decentralised network of thousands of independent nodes. No single entity can censor, remove, or demonetise your content.",
    icon: "▶",
  },
  {
    name: "Ethereum",
    role: "Smart contracts & tokens",
    desc: "Creator tokens, revenue splits, and governance will run on Ethereum smart contracts — transparent, unstoppable, and owned by the community. Not by BeeFree.",
    icon: "◆",
  },
  {
    name: "Privy MPC",
    role: "Self-custodial wallets",
    desc: "Every BeeFree user gets a real Ethereum wallet using MPC technology. No seed phrases. No complexity. You own your keys — export to MetaMask or any wallet, anytime.",
    icon: "◉",
  },
];

export default function TechStack() {
  return (
    <section
      className="py-24 border-b"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeUp>
          <div className="text-center mb-16">
            <p
              className="text-xs font-semibold tracking-widest mb-3 uppercase"
              style={{ color: "var(--color-text-muted)" }}
            >
              Built on real decentralised infrastructure
            </p>
            <h2
              className="text-2xl md:text-3xl font-bold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Not just a promise. Actually decentralised.
            </h2>
          </div>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {STACK.map((t, i) => (
            <FadeUp key={t.name} delay={i * 0.1}>
              <div className="flex flex-col gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-lg mb-1"
                  style={{
                    background: "var(--color-bg-surface)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {t.icon}
                </div>
                <p
                  className="font-bold text-lg"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {t.name}
                </p>
                <p
                  className="text-xs font-semibold"
                  style={{ color: "var(--color-accent)" }}
                >
                  {t.role}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {t.desc}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
