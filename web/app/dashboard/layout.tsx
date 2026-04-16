"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, authenticated, user } = useAuth();
  const router = useRouter();

  // Redirect if not logged in or not a creator
  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      router.push("/");
      return;
    }
    if (user && user.role !== "creator") {
      router.push("/explore");
    }
  }, [ready, authenticated, user, router]);

  if (!ready || !authenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16 flex">
        {/* Sidebar */}
        <aside
          className="hidden md:flex flex-col w-56 border-r border-border px-4 py-8 flex-shrink-0"
          style={{ background: "var(--bg-primary, #0a0a0a)" }}
        >
          <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-4 px-2">
            Dashboard
          </p>
          <nav className="flex flex-col gap-1">
            {[
              { href: "/dashboard", label: "Overview" },
              { href: "/dashboard/upload", label: "Upload" },
              { href: "/dashboard/videos", label: "My Videos" },
              { href: "/dashboard/stream", label: "Go Live" },
              { href: "/dashboard/profile", label: "Edit Profile" },
              { href: "/dashboard/earnings", label: "Earnings" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-6 py-8 max-w-5xl">{children}</main>
      </div>
    </div>
  );
}
