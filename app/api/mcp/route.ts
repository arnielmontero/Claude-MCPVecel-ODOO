import { createMcpHandler } from "mcp-handler";
import { registerHelloTool } from "@/src/tools/hello";
import { registerDiagnosticsTools } from "@/src/tools/diagnostics";
import { registerCustomerTools } from "@/src/tools/customers";

const handler = createMcpHandler(
  (server) => {
    registerHelloTool(server);
    registerDiagnosticsTools(server);
    registerCustomerTools(server);
  },
  {
    serverInfo: {
      name: "odoo-mcp-server",
      version: "0.1.0",
    },
  },
);

export { handler as GET, handler as POST };
