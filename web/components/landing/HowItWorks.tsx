"use client";

import FadeUp from "@/components/ui/FadeUp";
import ImgPlaceholder from "@/components/ui/ImgPlaceholder";

const STEPS = [
  {
    step: "01",
    title: "Sign up. Get your wallet.",
    desc: "Create an account with your phone or email. Instantly receive a self-custodial Ethereum wallet — no seed phrases, no complexity. Your keys, your identity.",
    imgLabel: "Step 1 illustration · 400×300px",
  },
  {
    step: "02",
    title: "Upload. Go live. Own it.",
    desc: "Upload videos, stream live performances, release music. Your content is stored on Livepeer — a decentralised network. Nobody can take it down or silence you.",
    imgLabel: "Step 2 illustration · 400×300px",
  },
  {
    step: "03",
    title: "Earn directly from fans.",
    desc: "Fans subscribe, buy your creator tokens, or tip you directly. 95% goes straight to you — via UPI, card, or crypto. No waiting. No minimum thresholds.",
    imgLabel: "Step 3 illustration · 400×300px",
  },
];

export default function HowItWorks() {
  return (
    <section
      className="py-24 border-b"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeUp>
          <div className="mb-16">
            <p
              className="text-xs font-semibold tracking-widest mb-3 uppercase"
              style={{ color: "var(--color-accent)" }}
            >
              How it works
            </p>
            <h2
              className="text-3xl md:text-5xl font-bold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Built for creators.
              <br />
              <span style={{ color: "var(--color-text-muted)" }}>
                Owned by the community.
              </span>
            </h2>
          </div>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((item, i) => (
            <FadeUp key={item.step} delay={i * 0.12}>
              <div
                className="p-6 rounded-2xl h-full flex flex-col gap-5"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {/* Replace with real illustration when ready */}
                <ImgPlaceholder
                  label={item.imgLabel}
                  aspect="aspect-[4/3]"
                />
                <div>
                  <span
                    className="text-xs font-bold tracking-widest"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {item.step}
                  </span>
                  <h3
                    className="text-lg font-bold mt-1 mb-2"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {item.desc}
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
