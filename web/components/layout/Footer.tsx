import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-display text-lg text-text-primary">BeeFree</p>
        <p className="text-sm text-text-muted">
          © 2026 BeeFree. Artists keep what they earn.
        </p>
        <div className="flex items-center gap-6">
          <Link href="/about" className="text-sm text-text-muted hover:text-text-secondary transition-colors">
            About
          </Link>
          <Link href="/terms" className="text-sm text-text-muted hover:text-text-secondary transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="text-sm text-text-muted hover:text-text-secondary transition-colors">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  )
}