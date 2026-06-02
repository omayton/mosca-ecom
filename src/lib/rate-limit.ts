/**
 * Simple in-memory rate limiter for serverless functions.
 * Uses a sliding window approach. Resets on cold start (acceptable for Vercel Fluid Compute).
 * For production at scale, consider Vercel KV or Upstash Redis.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (now > entry.resetAt) store.delete(key)
  })
}, 5 * 60 * 1000)

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number
  /** Window duration in seconds */
  windowSeconds: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const key = identifier

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: config.limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= config.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: config.limit - entry.count, resetAt: entry.resetAt }
}

/**
 * Get client IP from request headers (works on Vercel)
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}

/** Preset configs */
export const RATE_LIMITS = {
  /** Login: 5 attempts per minute */
  login: { limit: 5, windowSeconds: 60 },
  /** Register: 3 per 5 minutes */
  register: { limit: 3, windowSeconds: 300 },
  /** Checkout/Payment: 10 per minute */
  checkout: { limit: 10, windowSeconds: 60 },
  /** General API: 30 per minute */
  api: { limit: 30, windowSeconds: 60 },
  /** Shipping calc: 20 per minute */
  shipping: { limit: 20, windowSeconds: 60 },
} as const
