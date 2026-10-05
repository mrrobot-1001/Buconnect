import { LRUCache } from 'lru-cache';

// Rate limiter using token bucket algorithm with LRU cache
interface RateLimitOptions {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max unique tokens (IPs) to track
  maxRequests: number; // Max requests per interval
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

class RateLimiter {
  private cache: LRUCache<string, TokenBucket>;
  private interval: number;
  private maxRequests: number;

  constructor(options: RateLimitOptions) {
    this.cache = new LRUCache<string, TokenBucket>({
      max: options.uniqueTokenPerInterval,
      ttl: options.interval,
    });
    this.interval = options.interval;
    this.maxRequests = options.maxRequests;
  }

  check(identifier: string, cost: number = 1): { success: boolean; limit: number; remaining: number; reset: number } {
    const now = Date.now();
    const bucket = this.cache.get(identifier) || {
      tokens: this.maxRequests,
      lastRefill: now,
    };

    // Refill tokens based on time elapsed
    const timePassed = now - bucket.lastRefill;
    const refillAmount = (timePassed / this.interval) * this.maxRequests;
    bucket.tokens = Math.min(this.maxRequests, bucket.tokens + refillAmount);
    bucket.lastRefill = now;

    const success = bucket.tokens >= cost;
    if (success) {
      bucket.tokens -= cost;
    }

    this.cache.set(identifier, bucket);

    return {
      success,
      limit: this.maxRequests,
      remaining: Math.floor(bucket.tokens),
      reset: now + this.interval,
    };
  }
}

// Create rate limiter instances for different endpoints
export const apiLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  maxRequests: 100, // 100 requests per minute
});

export const authLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  maxRequests: 10, // 10 auth requests per minute (more strict)
});

export const uploadLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  maxRequests: 20, // 20 uploads per minute
});

export const postLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  maxRequests: 2, // 2 posts per minute
});

// Helper function to get client IP
// Behind Cloudflare, CF-Connecting-IP is set by Cloudflare itself. The first
// X-Forwarded-For entry is whatever the client sent, so it can't be the key
// (rotating it would bypass every limit); use the entry nearest our proxy.
export function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const hops = forwarded.split(',').map(h => h.trim()).filter(Boolean);
    return hops[hops.length - 1] || 'unknown';
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

// Helper function to apply rate limiting to API routes
export async function applyRateLimit(
  request: Request,
  limiter: RateLimiter = apiLimiter
): Promise<Response | null> {
  const ip = getClientIp(request);
  const result = limiter.check(ip);

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Please try again later',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null; // No rate limit hit, proceed
}
