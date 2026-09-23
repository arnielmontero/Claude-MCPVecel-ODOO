import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { withToolLogging } from "@/src/security/logger";

/**
 * Simple, Odoo-free test tools (Build Process Phase 5). These exist only to
 * exercise structured input/output over MCP before Odoo is connected.
 */
export function registerDiagnosticsTools(server: McpServer) {
  server.registerTool(
    "get_server_status",
    {
      title: "Get Server Status",
      description: "Returns the current status of the MCP server.",
      inputSchema: z.object({}),
    },
    withToolLogging("get_server_status", async () => {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ status: "ok", server: "odoo-mcp-server" }),
          },
        ],
      };
    }),
  );

  server.registerTool(
    "get_current_time",
    {
      title: "Get Current Time",
      description: "Returns the current server time in ISO 8601 format.",
      inputSchema: z.object({}),
    },
    withToolLogging("get_current_time", async () => {
      return {
        content: [{ type: "text", text: new Date().toISOString() }],
      };
    }),
  );

  const calculateInput = z.object({
    operation: z.enum(["add", "subtract", "multiply", "divide"]),
    value1: z.number(),
    value2: z.number(),
  });

  server.registerTool(
    "calculate",
    {
      title: "Calculate",
      description: "Performs a basic arithmetic operation on two numbers.",
      inputSchema: calculateInput,
    },
    withToolLogging("calculate", async ({ operation, value1, value2 }) => {
      let result: number;
      switch (operation) {
        case "add":
          result = value1 + value2;
          break;
        case "subtract":
          result = value1 - value2;
          break;
        case "multiply":
          result = value1 * value2;
          break;
        case "divide":
          if (value2 === 0) {
            return {
              isError: true,
              content: [{ type: "text", text: "Division by zero is not allowed." }],
            };
          }
          result = value1 / value2;
          break;
      }

      return {
        content: [{ type: "text", text: JSON.stringify({ result }) }],
      };
    }),
  );
}
