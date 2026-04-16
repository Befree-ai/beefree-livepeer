import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is not defined. Add it to .env.local"
  )
}

// In Next.js, API routes run in a serverless environment
// Each request can be a new Node.js instance
// Without caching, every request creates a new DB connection
// With caching, we reuse existing connection = much faster

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Store cache on global object
// global persists across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache
}

// Initialize cache if it doesn't exist
if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null }
}

const cached = global.mongooseCache

async function connectDB(): Promise<typeof mongoose> {
  // Already connected — return immediately
  if (cached.conn) {
    return cached.conn
  }

  // Connection in progress — wait for it
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as string, {
        bufferCommands: false,
        // bufferCommands: false means operations fail immediately
        // if not connected, instead of queuing
        // better for serverless environments
      })
      .then((mongooseInstance) => {
        console.log("✅ MongoDB connected")
        return mongooseInstance
      })
      .catch((error) => {
        cached.promise = null  // reset on failure so next call retries
        throw error
      })
  }

  cached.conn = await cached.promise
  return cached.conn
}

export default connectDB