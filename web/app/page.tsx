import type { Metadata } from "next";
import LandingNav from "@/components/landing/LandingNav";
import BeFreeStory from "@/components/landing/BeFreeStory";

export const metadata: Metadata = {
  title: "BeFree — Own your network",
  description:
    "BeFree is a community-owned, decentralised network for communities, creators, brands and IPs. Business of Cinema × Ethereum co-founding team.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg-primary)" }}>
      <LandingNav />
      <BeFreeStory />
    </div>
  );
}