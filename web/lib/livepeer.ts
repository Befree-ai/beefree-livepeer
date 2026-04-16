import { Livepeer } from "livepeer"

const LIVEPEER_API_KEY = process.env.LIVEPEER_API_KEY

if (!LIVEPEER_API_KEY) {
  throw new Error(
    "LIVEPEER_API_KEY is not defined. Add it to .env.local"
  )
}

// Server-side only Livepeer client
// Import this ONLY in API routes and server components
// Never import in client components (exposes API key)
const livepeer = new Livepeer({
  apiKey: LIVEPEER_API_KEY,
})

export default livepeer