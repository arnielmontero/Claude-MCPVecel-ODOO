import { createMcpHandler, experimental_withMcpAuth as withMcpAuth } from "mcp-handler";
import { registerHelloTool } from "@/src/tools/hello";
import { registerDiagnosticsTools } from "@/src/tools/diagnostics";
import { registerCustomerTools } from "@/src/tools/customers";
import { registerProductTools } from "@/src/tools/products";
import { registerSalesTools } from "@/src/tools/sales";
import { registerReportTools } from "@/src/tools/reports";
import { verifyMcpToken } from "@/src/security/auth";

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
  },
);

const authedHandler = withMcpAuth(handler, verifyMcpToken, { required: true });

export { authedHandler as GET, authedHandler as POST };
