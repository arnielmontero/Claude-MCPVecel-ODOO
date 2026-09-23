import { createMcpHandler } from "mcp-handler";
import { registerHelloTool } from "@/src/tools/hello";
import { registerDiagnosticsTools } from "@/src/tools/diagnostics";
import { registerCustomerTools } from "@/src/tools/customers";
import { registerProductTools } from "@/src/tools/products";
import { registerSalesTools } from "@/src/tools/sales";

const handler = createMcpHandler(
  (server) => {
    registerHelloTool(server);
    registerDiagnosticsTools(server);
    registerCustomerTools(server);
    registerProductTools(server);
    registerSalesTools(server);
  },
  {
    serverInfo: {
      name: "odoo-mcp-server",
      version: "0.1.0",
    },
  },
);

export { handler as GET, handler as POST };
