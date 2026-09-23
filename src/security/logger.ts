/**
 * Structured request logging (Build Process Phase 9 / Section 17).
 * Logs to stdout as JSON lines — Vercel captures this automatically as
 * function logs, no extra infra required. Never logs credentials or
 * full tool arguments (which may contain customer data); only tool
 * name, outcome, and timing.
 */

export interface ToolCallLogEntry {
  timestamp: string;
  clientId: string;
  toolName: string;
  durationMs: number;
  success: boolean;
  errorMessage?: string;
}

export function logToolCall(entry: ToolCallLogEntry) {
  console.log(JSON.stringify({ type: "mcp_tool_call", ...entry }));
}

export function logAuthFailure(reason: string, clientHint?: string) {
  console.warn(
    JSON.stringify({
      type: "mcp_auth_failure",
      timestamp: new Date().toISOString(),
      reason,
      clientHint,
    }),
  );
}

export function logRateLimitExceeded(clientId: string) {
  console.warn(
    JSON.stringify({
      type: "mcp_rate_limit_exceeded",
      timestamp: new Date().toISOString(),
      clientId,
    }),
  );
}

/**
 * Wraps a tool callback so every call is logged with its real name,
 * duration, and outcome — used instead of mcp-handler's onEvent, whose
 * REQUEST_RECEIVED/REQUEST_COMPLETED events don't carry both the tool
 * name and the outcome on the same event.
 */
export function withToolLogging<Args extends unknown[], Result>(
  toolName: string,
  fn: (...args: Args) => Promise<Result>,
): (...args: Args) => Promise<Result> {
  return async (...args: Args) => {
    const startedAt = Date.now();
    try {
      const result = await fn(...args);
      logToolCall({
        timestamp: new Date(startedAt).toISOString(),
        clientId: "claude-pro",
        toolName,
        durationMs: Date.now() - startedAt,
        success: true,
      });
      return result;
    } catch (err) {
      logToolCall({
        timestamp: new Date(startedAt).toISOString(),
        clientId: "claude-pro",
        toolName,
        durationMs: Date.now() - startedAt,
        success: false,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  };
}
