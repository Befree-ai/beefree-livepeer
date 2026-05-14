"use client";

interface ImgPlaceholderProps {
  label: string;
  aspect?: string;
  className?: string;
}

export default function ImgPlaceholder({
  label,
  aspect = "aspect-video",
  className = "",
}: ImgPlaceholderProps) {
  return (
    <div
      className={`${aspect} ${className} rounded-2xl flex flex-col items-center justify-center gap-2 border border-dashed`}
      style={{
        background: "rgba(255,255,255,0.015)",
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        style={{ color: "var(--color-text-muted)" }}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </p>
    </div>
  );
}
