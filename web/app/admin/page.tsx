"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePrivy } from "@privy-io/react-auth";
import Navbar from "@/components/layout/Navbar";
import FadeUp from "@/components/ui/FadeUp";

const ADMIN_EMAIL    = process.env.NEXT_PUBLIC_ADMIN_EMAIL!
const ADMIN_PRIVY_ID = process.env.NEXT_PUBLIC_ADMIN_PRIVY_ID!

interface Stats {
  totalUsers: number;
  totalCreators: number;
  pendingApplications: number;
  activeSubscriptions: number;
}

interface Application {
  _id: string;
  name: string;
  bio: string;
  genre: string[];
  instagramHandle: string;
  sampleWorkUrl: string;
  status: string;
  createdAt: string;
  user: { _id: string; name: string; email: string; phone: string };
}

interface Subscription {
  _id: string;
  fanName: string;
  creatorName: string;
  amount: number;
  status: string;
  validUntil: string;
  createdAt: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const { getAccessToken } = usePrivy();

  const [tab, setTab] = useState<"applications" | "subscriptions">("applications");
  const [stats, setStats] = useState<Stats | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isAdmin = user?.email === ADMIN_EMAIL || (user as any)?.privyId === ADMIN_PRIVY_ID

  const fetchData = async (section: string) => {
    const token = await getAccessToken();
    if (!token) return;
    const res = await fetch(`/api/admin?section=${section}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success) return;
    return data.data;
  };

  useEffect(() => {
    if (!user || !isAdmin) { setLoading(false); return; }
    const loadAll = async () => {
      const [overviewData, appData, subData] = await Promise.all([
        fetchData("overview"),
        fetchData("applications"),
        fetchData("subscriptions"),
      ]);
      if (overviewData) setStats(overviewData);
      if (appData) setApplications(appData.applications);
      if (subData) setSubscriptions(subData.subscriptions);
      setLoading(false);
    };
    loadAll();
  }, [user]);

  const handleAction = async (applicationId: string, action: "approve" | "reject") => {
    setActionLoading(applicationId);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ applicationId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setApplications(prev => prev.filter(a => a._id !== applicationId));
        setStats(prev => prev ? {
          ...prev,
          pendingApplications: prev.pendingApplications - 1,
          totalCreators: action === "approve" ? prev.totalCreators + 1 : prev.totalCreators,
        } : prev);
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg-primary)" }}>
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
        </main>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg-primary)" }}>
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold mb-2"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
              Access denied.
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              This page is only for BeeFree admins.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg-primary)" }}>
      <Navbar />
      <main className="flex-1 pt-16 w-full">
        <div className="max-w-6xl mx-auto px-6 py-10">

          {/* Header */}
          <FadeUp>
            <div className="mb-8">
              <p className="text-xs font-semibold tracking-widest mb-2 uppercase"
                style={{ color: "var(--color-accent)" }}>
                Admin
              </p>
              <h1 className="text-3xl font-bold"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
                BeeFree Control Panel
              </h1>
            </div>
          </FadeUp>

          {/* Stats */}
          {stats && (
            <FadeUp delay={0.05}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                  { label: "Total users", value: stats.totalUsers, color: false },
                  { label: "Creators", value: stats.totalCreators, color: false },
                  { label: "Pending applications", value: stats.pendingApplications, color: stats.pendingApplications > 0 },
                  { label: "Active subscriptions", value: stats.activeSubscriptions, color: false },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl p-5"
                    style={{
                      background: s.color ? "rgba(232,184,75,0.06)" : "var(--color-bg-surface)",
                      border: s.color ? "1px solid rgba(232,184,75,0.2)" : "1px solid rgba(255,255,255,0.06)",
                    }}>
                    <p className="text-2xl font-bold mb-1"
                      style={{
                        fontFamily: "var(--font-display)",
                        color: s.color ? "var(--color-accent)" : "var(--color-text-primary)",
                      }}>
                      {s.value}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </FadeUp>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {(["applications", "subscriptions"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 text-sm capitalize transition-all"
                style={{
                  color: tab === t ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  borderBottom: tab === t ? "2px solid var(--color-accent)" : "2px solid transparent",
                  borderTop: "none", borderLeft: "none", borderRight: "none",
                  background: "transparent", cursor: "pointer", paddingBottom: "10px",
                  fontWeight: tab === t ? 600 : 400,
                }}>
                {t === "applications"
                  ? `Applications (${applications.length})`
                  : `Subscriptions (${subscriptions.length})`}
              </button>
            ))}
          </div>

          {/* Applications */}
          {tab === "applications" && (
            <div className="flex flex-col gap-4">
              {applications.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-dashed"
                  style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    No pending applications
                  </p>
                </div>
              ) : (
                applications.map(app => (
                  <div key={app._id} className="rounded-2xl p-6"
                    style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        {/* Name + genres */}
                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                          <h3 className="font-bold text-base"
                            style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
                            {app.name}
                          </h3>
                          {app.genre.slice(0, 3).map(g => (
                            <span key={g} className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: "rgba(232,184,75,0.08)",
                                border: "1px solid rgba(232,184,75,0.15)",
                                color: "var(--color-accent)",
                              }}>
                              {g}
                            </span>
                          ))}
                        </div>

                        {/* Contact + date */}
                        <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
                          {app.user?.email || app.user?.phone || "No contact"} ·{" "}
                          {new Date(app.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>

                        {/* Bio */}
                        <p className="text-sm leading-relaxed mb-3"
                          style={{ color: "var(--color-text-secondary)" }}>
                          {app.bio}
                        </p>

                        {/* Links */}
                        <div className="flex flex-col gap-1">
                          {app.instagramHandle && (
                            <a href={`https://instagram.com/${app.instagramHandle}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-xs hover:underline w-fit"
                              style={{ color: "var(--color-accent)" }}>
                              @{app.instagramHandle} ↗
                            </a>
                          )}
                          {app.sampleWorkUrl && (
                            <a href={app.sampleWorkUrl}
                              target="_blank" rel="noopener noreferrer"
                              className="text-xs hover:underline w-fit"
                              style={{ color: "var(--color-accent)" }}>
                              Sample work ↗
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAction(app._id, "approve")}
                          disabled={actionLoading === app._id}
                          className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                          style={{
                            background: actionLoading === app._id
                              ? "rgba(232,184,75,0.3)" : "var(--color-accent)",
                            color: "#000", border: "none",
                            cursor: actionLoading === app._id ? "not-allowed" : "pointer",
                            opacity: actionLoading === app._id ? 0.6 : 1,
                          }}>
                          {actionLoading === app._id ? "..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleAction(app._id, "reject")}
                          disabled={actionLoading === app._id}
                          className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
                          style={{
                            background: "transparent",
                            color: "var(--color-text-muted)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            cursor: actionLoading === app._id ? "not-allowed" : "pointer",
                          }}>
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Subscriptions */}
          {tab === "subscriptions" && (
            <div className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              {subscriptions.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    No subscriptions yet
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {["Fan", "Creator", "Amount", "Status", "Valid Until", "Date"].map(h => (
                        <th key={h} className="text-left text-xs font-semibold px-4 py-3"
                          style={{ color: "var(--color-text-muted)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub, i) => (
                      <tr key={sub._id}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                        }}>
                        <td className="px-4 py-3 text-sm"
                          style={{ color: "var(--color-text-primary)" }}>
                          {sub.fanName || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm"
                          style={{ color: "var(--color-text-primary)" }}>
                          {sub.creatorName || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium"
                          style={{ color: "var(--color-accent)" }}>
                          ₹{Math.round(sub.amount / 100)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{
                              background: sub.status === "active"
                                ? "rgba(29,158,117,0.1)" : "rgba(255,255,255,0.04)",
                              color: sub.status === "active"
                                ? "#1D9E75" : "var(--color-text-muted)",
                            }}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs"
                          style={{ color: "var(--color-text-muted)" }}>
                          {new Date(sub.validUntil).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-xs"
                          style={{ color: "var(--color-text-muted)" }}>
                          {new Date(sub.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
