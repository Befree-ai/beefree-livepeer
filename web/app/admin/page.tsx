"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePrivy } from "@privy-io/react-auth";
import Navbar from "@/components/layout/Navbar";

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
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
}

interface Subscription {
  _id: string;
  fanName: string;
  creatorName: string;
  amount: number;
  status: string;
  validUntil: string;
  createdAt: string;
  razorpayPaymentId: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const { getAccessToken } = usePrivy();

  const [tab, setTab] = useState<"applications" | "subscriptions">(
    "applications",
  );
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
    if (!data.success) return data;

    return data.data;
  };

  useEffect(() => {
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }

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

  const handleAction = async (
    applicationId: string,
    action: "approve" | "reject",
  ) => {
    setActionLoading(applicationId);
    try {
      const token = await getAccessToken();
      if (!token) return;

      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ applicationId, action }),
      });

      const data = await res.json();
      if (data.success) {
        // Remove from list
        setApplications((prev) => prev.filter((a) => a._id !== applicationId));
        // Update stats
        setStats((prev) =>
          prev
            ? {
                ...prev,
                pendingApplications: prev.pendingApplications - 1,
                totalCreators:
                  action === "approve"
                    ? prev.totalCreators + 1
                    : prev.totalCreators,
              }
            : prev,
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div
            className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderColor: "var(--color-accent)",
              borderTopColor: "transparent",
            }}
          />
        </main>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <p className="text-text-muted">Access denied.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 w-full">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="font-display text-3xl font-semibold text-text-primary mb-8">
            Admin
          </h1>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: "Total users", value: stats.totalUsers },
                { label: "Creators", value: stats.totalCreators },
                {
                  label: "Pending applications",
                  value: stats.pendingApplications,
                },
                {
                  label: "Active subscriptions",
                  value: stats.activeSubscriptions,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-border bg-bg-surface p-5"
                >
                  <p className="font-display text-2xl font-semibold text-text-primary mb-1">
                    {s.value}
                  </p>
                  <p className="text-xs text-text-muted">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-border">
            {(["applications", "subscriptions"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-2 text-sm capitalize transition-all"
                style={{
                  color:
                    tab === t
                      ? "var(--color-text-primary)"
                      : "var(--color-text-muted)",
                  borderBottom:
                    tab === t
                      ? "2px solid var(--color-accent)"
                      : "2px solid transparent",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  background: "transparent",
                  cursor: "pointer",
                  paddingBottom: "10px",
                }}
              >
                {t === "applications"
                  ? `Applications (${applications.length})`
                  : `Subscriptions (${subscriptions.length})`}
              </button>
            ))}
          </div>

          {/* Applications tab */}
          {tab === "applications" && (
            <div className="flex flex-col gap-4">
              {applications.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-xl">
                  <p className="text-text-muted text-sm">
                    No pending applications
                  </p>
                </div>
              ) : (
                applications.map((app) => (
                  <div
                    key={app._id}
                    className="rounded-xl border border-border bg-bg-surface p-6"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="font-medium text-text-primary">
                            {app.name}
                          </h3>
                          {app.genre.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {app.genre.slice(0, 3).map((g) => (
                                <span
                                  key={g}
                                  className="text-xs px-2 py-0.5 rounded-full border border-border text-text-muted"
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-text-muted mb-3">
                          {app.user?.email || app.user?.phone || "No contact"} ·{" "}
                          {new Date(app.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>

                        <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                          {app.bio}
                        </p>

                        <div className="flex flex-col gap-1">
                          {app.instagramHandle && (
                            <a
                              href={`https://instagram.com/${app.instagramHandle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-accent hover:underline w-fit"
                            >
                              @{app.instagramHandle} ↗
                            </a>
                          )}
                          {app.sampleWorkUrl && (
                            <a
                              href={app.sampleWorkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-accent hover:underline w-fit"
                            >
                              Sample work ↗
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAction(app._id, "approve")}
                          disabled={actionLoading === app._id}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                          style={{
                            background:
                              actionLoading === app._id
                                ? "var(--color-bg-elevated)"
                                : "var(--color-accent)",
                            color: "#000",
                            border: "none",
                            cursor:
                              actionLoading === app._id
                                ? "not-allowed"
                                : "pointer",
                            opacity: actionLoading === app._id ? 0.6 : 1,
                          }}
                        >
                          {actionLoading === app._id ? "..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleAction(app._id, "reject")}
                          disabled={actionLoading === app._id}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                          style={{
                            background: "transparent",
                            color: "var(--color-text-muted)",
                            border: "1px solid var(--color-border)",
                            cursor:
                              actionLoading === app._id
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Subscriptions tab */}
          {tab === "subscriptions" && (
            <div className="rounded-xl border border-border overflow-hidden">
              {subscriptions.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-text-muted text-sm">
                    No subscriptions yet
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        "Fan",
                        "Creator",
                        "Amount",
                        "Status",
                        "Valid Until",
                        "Date",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left text-xs text-text-muted font-medium px-4 py-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub, i) => (
                      <tr
                        key={sub._id}
                        className="border-b border-border last:border-0"
                        style={{
                          background:
                            i % 2 === 0
                              ? "transparent"
                              : "var(--color-bg-elevated)",
                        }}
                      >
                        <td className="px-4 py-3 text-text-primary">
                          {sub.fanName || "—"}
                        </td>
                        <td className="px-4 py-3 text-text-primary">
                          {sub.creatorName || "—"}
                        </td>
                        <td className="px-4 py-3 text-text-primary">
                          ₹{Math.round(sub.amount / 100)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs px-2 py-1 rounded-full"
                            style={{
                              background:
                                sub.status === "active"
                                  ? "#1D9E7515"
                                  : "var(--color-bg-elevated)",
                              color:
                                sub.status === "active"
                                  ? "#1D9E75"
                                  : "var(--color-text-muted)",
                            }}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs">
                          {new Date(sub.validUntil).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs">
                          {new Date(sub.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
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
