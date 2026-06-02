"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";

export default function Navbar() {
  const { ready, authenticated, login, logout, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 backdrop-blur-xl"
      style={{
        borderBottom: "1px solid var(--color-border, #1f1f1f)",
        background: "rgba(10,10,10,0.9)",
      }}
    >
      <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-display text-lg font-semibold text-text-primary"
        >
          BeeFree
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {authenticated && (
            <>
              <Link
                href="/feed"
                className="text-sm px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
              >
                Feed
              </Link>
              <Link
                href="/explore"
                className="text-sm px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
              >
                Explore
              </Link>
              {authenticated && (
                <Link
                  href="/dashboard"
                  className="text-sm px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
                >
                  Dashboard
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-2">
          {!ready ? (
            <div className="w-7 h-7 rounded-full bg-bg-elevated animate-pulse" />
          ) : authenticated ? (
            <>
              <Link
                href={
                  !user
                    ? "#"
                    : user?.role === "creator"
                      ? `/creator/${user._id}`
                      : `/profile/${user._id}`
                }
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:border-border-hover transition-all"
                style={{
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg-surface)",
                }}
              >
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-xs font-semibold text-accent">
                    {user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
                <span className="text-sm text-text-secondary">
                  {user?.name?.split(" ")[0] || "User"}
                </span>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={login}>
                Sign in
              </Button>
              <Button variant="primary" size="sm" onClick={login}>
                Get started
              </Button>
            </>
          )}
        </div>

        {/* Mobile right side */}
        <div className="flex md:hidden items-center gap-2">
          {!ready ? (
            <div className="w-7 h-7 rounded-full bg-bg-elevated animate-pulse" />
          ) : !authenticated ? (
            <Button variant="primary" size="sm" onClick={login}>
              Sign in
            </Button>
          ) : (
            <Link
              href={
                !user
                  ? "#"
                  : user?.role === "creator"
                    ? `/creator/${user._id}`
                    : `/profile/${user._id}`
              }
              className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center"
            >
              <span className="text-xs font-semibold text-accent">
                {user?.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </Link>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
            style={{ background: "transparent", border: "none" }}
          >
            {menuOpen ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div
          className="md:hidden absolute top-14 left-0 right-0 py-3 px-4 flex flex-col gap-1"
          style={{
            background: "rgba(10,10,10,0.98)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          {/* Feed — for logged in users */}
          {authenticated && (
            <Link
              href="/feed"
              onClick={() => setMenuOpen(false)}
              className="text-sm px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
            >
              Feed
            </Link>
          )}

          <Link
            href="/explore"
            onClick={() => setMenuOpen(false)}
            className="text-sm px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
          >
            Explore
          </Link>

          {authenticated && (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="text-sm px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/upload"
                onClick={() => setMenuOpen(false)}
                className="text-sm px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
              >
                Upload
              </Link>
              <Link
                href="/dashboard/videos"
                onClick={() => setMenuOpen(false)}
                className="text-sm px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
              >
                My Videos
              </Link>
              <Link
                href="/dashboard/stream"
                onClick={() => setMenuOpen(false)}
                className="text-sm px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
              >
                Go Live
              </Link>
              <Link
                href="/dashboard/profile"
                onClick={() => setMenuOpen(false)}
                className="text-sm px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
              >
                Edit Profile
              </Link>
            </>
          )}

          <div className="h-px bg-border my-1" />

          {authenticated ? (
            <button
              onClick={() => {
                logout();
                setMenuOpen(false);
              }}
              className="text-sm px-3 py-2.5 rounded-lg text-red-400 hover:bg-bg-elevated transition-all text-left"
              style={{ background: "transparent", border: "none" }}
            >
              Sign out
            </button>
          ) : (
            <button
              onClick={() => {
                login();
                setMenuOpen(false);
              }}
              className="text-sm px-3 py-2.5 rounded-lg text-accent font-medium"
              style={{ background: "transparent", border: "none" }}
            >
              Sign in
            </button>
          )}
        </div>
      )}
    </header>
  );
}
