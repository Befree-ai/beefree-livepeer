'use client'

import { useAuth } from '../hooks/useAuth'

export default function Home() {
  const { ready, authenticated, login, logout, user, isLoading } = useAuth()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">BeeFree</h1>
      <p>Privy ready: {ready ? '✅' : '⏳'}</p>
      <p>Authenticated: {authenticated ? '✅' : '❌'}</p>
      <p>DB User: {isLoading ? '⏳ syncing...' : user ? '✅ ' + user.role : '❌ not synced'}</p>
      {ready && !authenticated && (
        <button
          onClick={login}
          className="bg-emerald-500 text-white px-6 py-2 rounded-lg"
        >
          Login
        </button>
      )}
      {authenticated && (
        <button
          onClick={logout}
          className="bg-red-500 text-white px-6 py-2 rounded-lg"
        >
          Logout
        </button>
      )}
    </div>
  )
}