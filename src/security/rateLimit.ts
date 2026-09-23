/**
 * MCP endpoint rate limiting (Build Process Phase 9). A simple in-memory
 * sliding window per authenticated client. There is exactly one
 * authorized client (Claude Pro, via the shared bearer token) rather
 * than public traffic, so this protects Odoo from a misbehaving or
 * looping caller — it does not need to coordinate across serverless
 * instances or survive cold starts.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;

const requestLog = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

export function checkRateLimit(clientId: string): RateLimitResult {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const timestamps = (requestLog.get(clientId) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterMs = timestamps[0] + WINDOW_MS - now;
    requestLog.set(clientId, timestamps);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  timestamps.push(now);
  requestLog.set(clientId, timestamps);

  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - timestamps.length };
}
