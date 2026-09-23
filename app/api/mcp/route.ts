import { createMcpHandler, experimental_withMcpAuth as withMcpAuth } from "mcp-handler";
import { registerHelloTool } from "@/src/tools/hello";
import { registerDiagnosticsTools } from "@/src/tools/diagnostics";
import { registerCustomerTools } from "@/src/tools/customers";
import { registerProductTools } from "@/src/tools/products";
import { registerSalesTools } from "@/src/tools/sales";
import { registerReportTools } from "@/src/tools/reports";
import { verifyMcpToken } from "@/src/security/auth";
import { checkRateLimit } from "@/src/security/rateLimit";
import { logRateLimitExceeded, logToolCall } from "@/src/security/logger";

const handler = createMcpHandler(
  (server) => {
    registerHelloTool(server);
    registerDiagnosticsTools(server);
    registerCustomerTools(server);
    registerProductTools(server);
    registerSalesTools(server);
    registerReportTools(server);
  },
  {
    serverInfo: {
      name: "odoo-mcp-server",
      version: "0.1.0",
    },
    // Per-call logging (tool name, duration, success/failure) happens in
    // each tool's withToolLogging wrapper — onEvent's REQUEST_RECEIVED and
    // REQUEST_COMPLETED events don't carry both pieces on the same event,
    // so we only use onEvent here for transport-level errors.
    onEvent: (event) => {
      if (event.type === "ERROR") {
        logToolCall({
          timestamp: new Date(event.timestamp).toISOString(),
          clientId: "claude-pro",
          toolName: "unknown",
          durationMs: 0,
          success: false,
          errorMessage: typeof event.error === "string" ? event.error : event.error.message,
        });
      }
    },
  },
);

// withMcpAuth sets request.auth before invoking the handler it wraps, so
// rate limiting is applied here — inside the auth boundary — rather than
// around withMcpAuth, where request.auth would not be populated yet.
async function rateLimitedHandler(request: Request): Promise<Response> {
  const clientId = request.auth?.clientId ?? "unauthenticated";
  const result = checkRateLimit(clientId);

  if (!result.allowed) {
    logRateLimitExceeded(clientId);
    return new Response(
      JSON.stringify({ error: "rate_limited", error_description: "Too many requests." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((result.retryAfterMs ?? 1000) / 1000)),
        },
      },
    );
  }

  return handler(request);
}

const authedHandler = withMcpAuth(rateLimitedHandler, verifyMcpToken, { required: true });

export { authedHandler as GET, authedHandler as POST };
