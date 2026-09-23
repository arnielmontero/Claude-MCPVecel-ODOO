import type { AuthInfo } from "@modelcontextprotocol/server";

/**
 * MCP endpoint authentication (Build Process Phase 9). A single trusted
 * client (Claude Pro) authenticates with one static bearer token set as
 * the MCP_AUTH_TOKEN environment variable — not a full OAuth flow, since
 * there is exactly one authorized client for this server.
 */
export async function verifyMcpToken(
  _req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  const expectedToken = process.env.MCP_AUTH_TOKEN;

  if (!expectedToken) {
    throw new Error("MCP_AUTH_TOKEN is not configured on the server.");
  }

  if (!bearerToken || bearerToken !== expectedToken) {
    return undefined;
  }

  return {
    token: bearerToken,
    clientId: "claude-pro",
    scopes: ["mcp:tools"],
  };
}
