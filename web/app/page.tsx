"use client";

import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
// import { useEffect } from "react";
// import { useRouter } from "next/navigation";

const features = [
  {
    stat: "92%",
    label: "Revenue to artists",
    desc: "vs 55% on YouTube, 20% on labels",
  },
  {
    stat: "∞",
    label: "Permanent storage",
    desc: "Your music lives forever on Arweave",
  },
  {
    stat: "0",
    label: "Takedowns",
    desc: "No algorithm, no censorship, no middlemen",
  },
];

export default function LandingPage() {
  const { authenticated, login, user, isLoading } = useAuth();

  // const router = useRouter()

  // // Redirect logged in users to appropriate page
  // useEffect(() => {
  //   if (!isLoading && authenticated && user) {
  //     if (user.role === "creator") {
  //       router.push("/dashboard");
  //     } else {
  //       router.push("/feed");
  //     }
  //   }
  // }, [authenticated, user, isLoading, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
          <div className="max-w-3xl">
            <Badge variant="live" className="mb-6">
              India-first creator platform
            </Badge>

            <h1 className="font-display text-5xl md:text-7xl font-semibold text-text-primary mb-6 leading-tight">
              Your music.
              <br />
              <span className="text-accent">Your earnings.</span>
            </h1>

            <p className="text-lg text-text-secondary mb-10 max-w-xl leading-relaxed">
              BeeFree lets Indian artists release music directly to fans. No
              labels. No YouTube cuts. Just you and your audience.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              {authenticated ? (
                <Button
                  size="lg"
                  onClick={() => (window.location.href = "/feed")}
                >
                  Go to feed →
                </Button>
              ) : (
                <>
                  <Button size="lg" onClick={login}>
                    Start for free
                  </Button>
                  <Button size="lg" variant="ghost" onClick={login}>
                    Explore artists →
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
            {features.map((f) => (
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

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-text-primary mb-12">
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Verify your identity",
                desc: "Sign up with your phone or email. No passwords. Verified Indian artists get a blue tick.",
              },
              {
                step: "02",
                title: "Upload your music",
                desc: "Upload videos, albums, live sessions. Content is stored permanently — nobody can take it down.",
              },
              {
                step: "03",
                title: "Earn directly",
                desc: "Fans subscribe for ₹99/month. You receive 92% instantly via UPI. No waiting, no minimum thresholds.",
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

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="rounded-2xl border border-border bg-bg-surface p-10 md:p-16 text-center">
            <h2 className="font-display text-3xl md:text-5xl font-semibold text-text-primary mb-4">
              Ready to go free?
            </h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Join the artists who are done giving away their earnings.
            </p>
            <Button size="lg" onClick={login}>
              Join BeeFree
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
