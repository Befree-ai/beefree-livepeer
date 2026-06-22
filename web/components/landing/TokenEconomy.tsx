"use client";

import FadeUp from "@/components/ui/FadeUp";

const TOKENS = [
  {
    name: "BF Membership Token",
    symbol: "BFM",
    color: "var(--color-accent)",
    colorBg: "rgba(232,184,75,0.06)",
    colorBorder: "rgba(232,184,75,0.15)",
    desc: "Platform membership token. Grants access to the LyveFree network and gives holders governance rights to co-create the platform's future.",
  },
  {
    name: "Creator Token",
    symbol: "e.g. SRK",
    color: "var(--color-pink)",
    colorBg: "rgba(232,52,138,0.06)",
    colorBorder: "rgba(232,52,138,0.15)",
    desc: "Every creator launches their own token. Fans buy it to unlock premium content, support their artist, and participate in their success.",
  },
  {
    name: "Utility Token",
    symbol: "UTL",
    color: "#1D9E75",
    colorBg: "rgba(29,158,117,0.06)",
    colorBorder: "rgba(29,158,117,0.15)",
    desc: "Powers network activity. Earned by uploading, sharing, and inviting. The more you contribute to LyveFree, the more you receive.",
  },
];

export default function TokenEconomy() {
  return (
    <section
      className="py-24 border-b"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeUp>
          <div className="text-center mb-4">
            <p
              className="text-xs font-semibold tracking-widest mb-3 uppercase"
              style={{ color: "var(--color-accent)" }}
            >
              Token economy
            </p>
            <h2
              className="text-3xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              The future of creator finance.
            </h2>
            <p
              className="text-lg max-w-xl mx-auto mb-4"
              style={{ color: "var(--color-text-secondary)" }}
            >
              LyveFree is building a tokenised creator economy — where fans
              own a piece of the artists they love.
            </p>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: "rgba(232,52,138,0.08)",
                border: "1px solid rgba(232,52,138,0.2)",
                color: "var(--color-pink)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--color-pink)" }}
              />
              Coming soon · On-chain launch
            </span>
          </div>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {TOKENS.map((t, i) => (
            <FadeUp key={t.name} delay={i * 0.12}>
              <div
                className="p-6 rounded-2xl h-full flex flex-col gap-4"
                style={{
                  background: t.colorBg,
                  border: `1px solid ${t.colorBorder}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{
                      background: t.colorBg,
                      border: `1px solid ${t.colorBorder}`,
                      color: t.color,
                    }}
                  >
                    {t.symbol.slice(0, 3)}
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: t.colorBg,
                      color: t.color,
                      border: `1px solid ${t.colorBorder}`,
                    }}
                  >
                    Soon
                  </span>
                </div>
                <div>
                  <h3
                    className="text-base font-bold mb-2"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {t.name}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {t.desc}
                  </p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
