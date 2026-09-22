import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";

/**
 * Registers the smallest possible MCP tool: hello().
 * Proves the Claude -> MCP Server -> tool -> response path with no
 * Odoo, database, or Claude connection required (Build Process Phase 3).
 */
export function registerHelloTool(server: McpServer) {
  server.registerTool(
    "hello",
    {
      title: "Hello",
      description: "Returns a static greeting from the Odoo MCP Server. Used to verify the MCP protocol path end to end.",
      inputSchema: z.object({}),
    },
    async () => {
      return {
        content: [
          { type: "text", text: "Hello from the Odoo MCP Server." },
        ],
      };
    },
  );
}
