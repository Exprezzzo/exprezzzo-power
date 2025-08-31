// Simple in-memory token bucket with per-IP key (Edge-safe alternative recommended later)
const buckets = new Map<string, { tokens: number, ts: number }>();

export function allow(key: string, rate = { capacity: 60, refillPerSec: 1 }) {
  const now = Date.now()/1000;
  const b = buckets.get(key) || { tokens: rate.capacity, ts: now };
  const delta = Math.max(0, now - b.ts);
  const tokens = Math.min(rate.capacity, b.tokens + delta * rate.refillPerSec);
  const allowed = tokens >= 1;
  const next = { tokens: allowed ? tokens - 1 : tokens, ts: now };
  buckets.set(key, next);
  return allowed;
}