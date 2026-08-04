type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
let cleanupScheduled = false;

function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Rate limiter en memoria simple. Útil para rutas serverless donde no hay
 * Redis disponible. No es perfecto en entornos con múltiples instancias,
 * pero bloquea abusos desde una misma IP en una instancia.
 */
export function checkRateLimit(
  key: string,
  options: { windowMs: number; maxRequests: number }
): { allowed: boolean; remaining: number; resetAt: number } {
  scheduleCleanup();

  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetAt: now + options.windowMs,
    };
  }

  if (existing.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: options.maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}
