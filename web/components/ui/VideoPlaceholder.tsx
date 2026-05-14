"use client";

interface VideoPlaceholderProps {
  label: string;
}

export default function VideoPlaceholder({ label }: VideoPlaceholderProps) {
  return (
    <div
      className="aspect-video rounded-2xl flex flex-col items-center justify-center gap-3 border border-dashed"
      style={{
        background: "rgba(255,255,255,0.015)",
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(232,184,75,0.12)",
          border: "1px solid rgba(232,184,75,0.25)",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ color: "var(--color-accent)", marginLeft: "3px" }}
        >
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </p>
    </div>
  );
}
