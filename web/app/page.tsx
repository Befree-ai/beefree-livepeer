"use client";

import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

const stats = [
  {
    stat: "92%",
    label: "Revenue to creators",
    desc: "vs 55% on YouTube, 20% with labels",
  },
  {
    stat: "0",
    label: "Middlemen",
    desc: "No labels, no algorithms, no censorship",
  },
  {
    stat: "∞",
    label: "Ownership",
    desc: "Your content, your wallet, your community",
  },
];

const tokenomics = [
  {
    token: "BF Token",
    desc: "Platform membership token. Grants access to the BeeFree network and gives holders governance rights to co-create the platform's future.",
    color: "#f5e642",
  },
  {
    token: "Creator Token",
    desc: "Every creator launches their own token. Fans buy it to unlock premium content, support their favourite artist, and earn as the creator grows.",
    color: "#a855f7",
  },
  {
    token: "Utility Token",
    desc: "Powers the network. Earned by participating — uploading, sharing, inviting friends. The more you contribute, the more you receive.",
    color: "#1D9E75",
  },
];

export default function LandingPage() {
  const { authenticated, login } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
          <div className="max-w-3xl">
            <Badge variant="live" className="mb-6">
              Decentralised social network · India
            </Badge>

            <h1 className="font-display text-5xl md:text-7xl font-semibold text-text-primary mb-6 leading-tight">
              Power back
              <br />
              <span className="text-accent">to the people.</span>
            </h1>

            <p className="text-lg text-text-secondary mb-10 max-w-xl leading-relaxed">
              BeeFree is a decentralised social network where creators own their
              content, fans own creator tokens, and nobody takes a cut except
              you. No labels. No YouTube. No middlemen.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              {authenticated ? (
                <Button size="lg" onClick={() => window.location.href = "/feed"}>
                  Go to feed →
                </Button>
              ) : (
                <>
                  <Button size="lg" onClick={login}>
                    Join BeeFree
                  </Button>
                  <Button size="lg" variant="ghost" onClick={login}>
                    Explore creators →
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-px bg-border" />
        </div>

        {/* Stats */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((f) => (
              <div
                key={f.stat}
                className="p-6 rounded-xl border border-border bg-bg-surface hover:border-border-hover transition-colors"
              >
                <p className="font-display text-5xl font-semibold text-accent mb-2">
                  {f.stat}
                </p>
                <p className="text-base font-medium text-text-primary mb-1">
                  {f.label}
                </p>
                <p className="text-sm text-text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-px bg-border" />
        </div>

        {/* The problem */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold text-accent tracking-widest mb-4 uppercase">The problem</p>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-text-primary mb-6 leading-tight">
                Big tech makes us the product.
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Facebook, YouTube, and Spotify make trillions owning your data
                and your audience. You create the content. They keep the money.
                A T-Series takes 80% of your earnings before you see a rupee.
              </p>
              <p className="text-text-secondary leading-relaxed">
                There is a better way. Blockchain technology makes it possible
                to monetise your own data, own your audience, and earn directly
                from your fans — without any platform taking a cut.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { platform: "YouTube", cut: "45%", yours: "55%" },
                { platform: "Spotify", cut: "70%", yours: "30%" },
                { platform: "Labels", cut: "80%", yours: "20%" },
                { platform: "BeeFree", cut: "5%", yours: "95%", highlight: true },
              ].map((item) => (
                <div
                  key={item.platform}
                  className="flex items-center justify-between px-5 py-3.5 rounded-xl border transition-all"
                  style={{
                    borderColor: item.highlight ? "var(--color-accent)" : "var(--color-border)",
                    background: item.highlight ? "#f5e64208" : "var(--color-bg-surface)",
                  }}
                >
                  <p className="font-medium text-sm" style={{ color: item.highlight ? "var(--color-accent)" : "var(--color-text-primary)" }}>
                    {item.platform}
                  </p>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-text-muted">Platform takes</p>
                      <p className="text-sm font-semibold text-red-400">{item.cut}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-muted">You keep</p>
                      <p className="text-sm font-semibold" style={{ color: item.highlight ? "var(--color-accent)" : "#1D9E75" }}>{item.yours}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-px bg-border" />
        </div>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-xs font-semibold text-accent tracking-widest mb-4 uppercase">How it works</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-text-primary mb-12">
            Built for creators. Owned by the community.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Get your wallet",
                desc: "Sign up and instantly receive a self-custodial Ethereum wallet. No seed phrases. Your keys, your crypto, your identity — all in one place.",
              },
              {
                step: "02",
                title: "Create and own",
                desc: "Upload videos, go live, release music. Content is stored on decentralised infrastructure — nobody can take it down, demonetise you, or silence you.",
              },
              {
                step: "03",
                title: "Earn from your community",
                desc: "Launch your creator token. Fans buy it to support you and unlock premium content. You earn directly — no waiting, no thresholds, no middlemen.",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col gap-3">
                <span className="font-display text-xs font-semibold text-accent tracking-widest">
                  {item.step}
                </span>
                <h3 className="font-display text-xl font-semibold text-text-primary">
                  {item.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-px bg-border" />
        </div>

        {/* Token system */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-xs font-semibold text-accent tracking-widest mb-4 uppercase">Token economy</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-text-primary mb-4">
            Three tokens. One ecosystem.
          </h2>
          <p className="text-text-secondary mb-12 max-w-xl">
            BeeFree's tokenomics are designed to multiply abundance. The more
            you contribute, the more you earn.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tokenomics.map((t) => (
              <div
                key={t.token}
                className="p-6 rounded-xl border border-border bg-bg-surface hover:border-border-hover transition-all"
              >
                <div className="w-8 h-8 rounded-full mb-4" style={{ background: t.color }} />
                <h3 className="font-display text-lg font-semibold text-text-primary mb-2">
                  {t.token}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-px bg-border" />
        </div>

        {/* Tech stack */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-xs font-semibold text-accent tracking-widest mb-4 uppercase">Technology</p>
          <h2 className="font-display text-3xl font-semibold text-text-primary mb-12">
            Built on real decentralised infrastructure.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Livepeer",
                role: "Decentralised video",
                desc: "All video on BeeFree is stored and streamed via Livepeer — a decentralised network of independent nodes. No single entity can censor or take down your content.",
              },
              {
                name: "Ethereum",
                role: "Smart contracts",
                desc: "Creator tokens, revenue splits, and governance all run on Ethereum smart contracts — transparent, unstoppable, and owned by the community.",
              },
              {
                name: "Privy MPC",
                role: "Self-custodial wallets",
                desc: "Every BeeFree user gets a real Ethereum wallet using MPC technology. No seed phrases. You own your keys. Export to MetaMask anytime.",
              },
            ].map((item) => (
              <div key={item.name} className="flex flex-col gap-2">
                <p className="font-display text-lg font-semibold text-text-primary">{item.name}</p>
                <p className="text-xs text-accent font-medium">{item.role}</p>
                <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="rounded-2xl border border-border bg-bg-surface p-10 md:p-16 text-center">
            <Badge variant="live" className="mb-6">
              Now live · India
            </Badge>
            <h2 className="font-display text-3xl md:text-5xl font-semibold text-text-primary mb-4">
              Be free.
            </h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Join the creators and fans building a new decentralised social
              network where the community co-owns and earns from the network.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button size="lg" onClick={login}>
                Join BeeFree
              </Button>
              <Button size="lg" variant="ghost" onClick={() => window.location.href = "/explore"}>
                Explore creators →
              </Button>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}