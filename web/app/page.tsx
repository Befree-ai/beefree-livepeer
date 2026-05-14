"use client";

import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import MarqueeStrip from "@/components/landing/MarqueeStrip";
import StatsSection from "@/components/landing/StatsSection";
import PlatformPreview from "@/components/landing/PlatformPreview";
import RevenueComparison from "@/components/landing/RevenueComparison";
import HowItWorks from "@/components/landing/HowItWorks";
import TokenEconomy from "@/components/landing/TokenEconomy";
import CreatorSpotlight from "@/components/landing/CreatorSpotlight";
import TechStack from "@/components/landing/TechStack";
import FinalCTA from "@/components/landing/FinalCTA";

export default function LandingPage() {
  const { authenticated, login } = useAuth();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg-primary)" }}>
      <style>{`
        @keyframes orb1 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(-50px, 40px) scale(1.08); }
        }
        @keyframes orb2 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(40px, -50px) scale(1.12); }
        }
      `}</style>

      <Navbar />
      <HeroSection authenticated={authenticated} onLogin={login} />
      <MarqueeStrip />
      <StatsSection />
      <PlatformPreview />
      <RevenueComparison />
      <HowItWorks />
      <TokenEconomy />
      <CreatorSpotlight />
      <TechStack />
      <FinalCTA onLogin={login} />
      <Footer />
    </div>
  );
}
