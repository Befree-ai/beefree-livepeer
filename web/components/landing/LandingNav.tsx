"use client";

import Link from "next/link";
import { useLoginToDashboard } from "@/hooks/useLoginToDashboard";

const LINKS = [
  { label: "Journey", href: "#journey" },
  { label: "What is BeFree", href: "#what" },
  { label: "For everyone", href: "#everyone" },
  { label: "Network", href: "#network" },
  { label: "Community", href: "#community" },
];

export default function LandingNav() {
  const { start, authenticated } = useLoginToDashboard();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 border-b backdrop-blur-xl"
      style={{ background: "rgba(8,8,8,0.86)", borderColor: "rgba(255,255,255,0.07)" }}
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between gap-4 px-5">
        <Link
          href="/"
          className="text-[21px] font-extrabold tracking-tight text-[#f5f5f0]"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          Be<span className="text-[#e8b84b]">Free</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-[15px] text-[#b9b9b0] transition-colors hover:text-[#f5f5f0]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!authenticated && (
            <button
              onClick={start}
              className="hidden px-2 text-[15px] text-[#b9b9b0] transition-colors hover:text-[#f5f5f0] sm:block"
            >
              Sign in
            </button>
          )}
          <button
            onClick={start}
            className="rounded-xl bg-[#e8b84b] px-5 py-2.5 text-[15px] font-semibold text-black transition-opacity hover:opacity-90"
          >
            {authenticated ? "Go to dashboard →" : "Click to Bee Free →"}
          </button>
        </div>
      </div>
    </header>
  );
}