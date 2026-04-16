'use client'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function ExplorePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 max-w-6xl mx-auto px-6 py-12 w-full">
        <h1 className="font-display text-4xl font-semibold text-text-primary mb-2">
          Explore
        </h1>
        <p className="text-text-secondary mb-10">
          Discover artists and their music
        </p>

        {/* Placeholder — we'll fill this with real data soon */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-bg-surface p-6 animate-pulse"
            >
              <div className="w-16 h-16 rounded-full bg-bg-elevated mb-4" />
              <div className="h-4 bg-bg-elevated rounded w-3/4 mb-2" />
              <div className="h-3 bg-bg-elevated rounded w-1/2" />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}