"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePrivy } from "@privy-io/react-auth";
import FadeUp from "@/components/ui/FadeUp";

const GENRES = [
  "Bollywood", "Indie", "Classical", "Folk", "Hip-Hop",
  "Electronic", "Jazz", "Rock", "Pop", "Devotional",
  "Ghazal", "Sufi", "Fusion", "Instrumental", "Punjabi", "Other",
];

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  color: "var(--color-text-primary)",
  fontSize: "14px",
  outline: "none",
}

function Field({ label, hint, count, max, children }: {
  label: string; hint?: string; count?: number; max?: number; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {label}
          {hint && <span className="font-normal ml-2 text-xs" style={{ color: "var(--color-text-muted)" }}>{hint}</span>}
        </label>
        {count !== undefined && max && (
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{count}/{max}</span>
        )}
      </div>
      {children}
    </div>
  )
}

export default function EditProfilePage() {
  const { user, syncUser } = useAuth();
  const { getAccessToken } = usePrivy();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [genre, setGenre] = useState<string[]>([]);
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [subscriptionPrice, setSubscriptionPrice] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setBio(user.bio || "");
    const u = user as any;
    setGenre(u.genre || []);
    setInstagram(u.socialLinks?.instagram || "");
    setTwitter(u.socialLinks?.twitter || "");
    setYoutube(u.socialLinks?.youtube || "");
    setSubscriptionPrice(u.subscriptionPrice ? String(u.subscriptionPrice / 100) : "99");
    // Set current avatar as preview
    if (user.avatar) setAvatarPreview(user.avatar);
  }, [user]);

  const toggleGenre = (g: string) => {
    setGenre(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  // Handle avatar file selection + upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Cloudinary via our API
    setUploadingAvatar(true);
    setAvatarError(null);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "avatar");

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Upload failed");

      // Sync user to get updated avatar
      await syncUser();
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed");
      setAvatarPreview(user?.avatar || null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, bio, genre, socialLinks: { instagram, twitter, youtube }, subscriptionPrice }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to save");
      await syncUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="max-w-2xl">
      <FadeUp>
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest mb-2 uppercase"
            style={{ color: "var(--color-accent)" }}>
            Profile
          </p>
          <h1 className="text-3xl font-bold mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
            Edit profile
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Help fans discover you
          </p>
        </div>
      </FadeUp>

      <FadeUp delay={0.05}>
        <div className="flex flex-col gap-6">

          {/* Avatar upload */}
          <div>
            <label className="block text-sm font-semibold mb-3"
              style={{ color: "var(--color-text-primary)" }}>
              Profile photo
            </label>
            <div className="flex items-center gap-5">
              {/* Avatar preview */}
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold overflow-hidden flex-shrink-0 relative"
                style={{
                  background: avatarPreview ? "transparent" : "linear-gradient(135deg, #E8B84B, #E8348A)",
                  color: "#000",
                  border: "2px solid rgba(255,255,255,0.1)",
                }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview"
                    className="w-full h-full object-cover" />
                ) : initial}

                {/* Loading overlay */}
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)" }}>
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
                  </div>
                )}
              </div>

              {/* Upload button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all mb-1.5"
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent",
                    color: uploadingAvatar ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                    cursor: uploadingAvatar ? "not-allowed" : "pointer",
                  }}>
                  {uploadingAvatar ? "Uploading..." : "Upload photo"}
                </button>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  JPG or PNG · Max 5MB
                </p>
                {avatarError && (
                  <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{avatarError}</p>
                )}
              </div>
            </div>
          </div>

          <Field label="Display name">
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Your artist name" style={inputStyle} />
          </Field>

          <Field label="Bio" count={bio.length} max={500}>
            <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 500))}
              placeholder="Tell fans about yourself..." rows={4}
              style={{ ...inputStyle, resize: "none" }} />
          </Field>

          <Field label="Genre" hint="Select all that apply">
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => {
                const selected = genre.includes(g)
                return (
                  <button key={g} onClick={() => toggleGenre(g)}
                    className="text-xs px-3 py-1.5 rounded-full transition-all"
                    style={{
                      borderWidth: "1px", borderStyle: "solid",
                      borderColor: selected ? "var(--color-accent)" : "rgba(255,255,255,0.08)",
                      background: selected ? "rgba(232,184,75,0.1)" : "transparent",
                      color: selected ? "var(--color-accent)" : "var(--color-text-muted)",
                      cursor: "pointer", fontWeight: selected ? 600 : 400,
                    }}>
                    {g}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Social links">
            <div className="flex flex-col gap-3">
              {[
                { label: "Instagram", value: instagram, set: setInstagram, placeholder: "instagram.com/yourhandle" },
                { label: "Twitter / X", value: twitter, set: setTwitter, placeholder: "x.com/yourhandle" },
                { label: "YouTube", value: youtube, set: setYoutube, placeholder: "youtube.com/@yourchannel" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-xs w-20 flex-shrink-0" style={{ color: "var(--color-text-muted)" }}>
                    {s.label}
                  </span>
                  <input type="text" value={s.value} onChange={e => s.set(e.target.value)}
                    placeholder={s.placeholder} style={{ ...inputStyle }} />
                </div>
              ))}
            </div>
          </Field>

          <Field label="Subscription price" hint="₹/month">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>₹</span>
              <input type="number" value={subscriptionPrice}
                onChange={e => setSubscriptionPrice(e.target.value)}
                placeholder="99" min="1"
                style={{ ...inputStyle, width: "120px" }} />
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>per month</span>
            </div>
            <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)" }}>
              Fans pay this to unlock your premium content
            </p>
          </Field>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm"
              style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: saving ? "rgba(232,184,75,0.3)" : "var(--color-accent)",
                color: "#000", border: "none",
                cursor: saving ? "not-allowed" : "pointer",
              }}>
              {saving ? "Saving..." : "Save changes"}
            </button>
            {saved && (
              <span className="text-sm font-medium" style={{ color: "#1D9E75" }}>✓ Saved!</span>
            )}
          </div>

        </div>
      </FadeUp>
    </div>
  );
}
