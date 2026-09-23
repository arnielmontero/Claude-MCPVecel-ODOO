import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { resolveSalesSummary } from "@/src/reports/resolver";
import { generateSalesSummaryExcel } from "@/src/reports/excel";
import { generateSalesSummaryPdf } from "@/src/reports/pdf";
import { withToolLogging } from "@/src/security/logger";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.");

const dateRangeInput = z.object({
  date_from: dateSchema.describe("Start of the reporting period, inclusive (YYYY-MM-DD)."),
  date_to: dateSchema.describe("End of the reporting period, inclusive (YYYY-MM-DD)."),
});

/**
 * Reporting MCP tools (Build Process Phase 8/15/16). Every tool here
 * calls the fixed resolver in src/reports/resolver.ts for figures — the
 * LLM never computes report numbers itself, it only requests and
 * displays what the resolver returns.
 */
export function registerReportTools(server: McpServer) {
  server.registerTool(
    "get_sales_summary",
    {
      title: "Get Sales Summary",
      description:
        "Returns confirmed Odoo sales order totals for a date range, resolved directly from Odoo (not calculated by the model).",
      inputSchema: dateRangeInput,
    },
    withToolLogging("get_sales_summary", async ({ date_from, date_to }) => {
      const summary = await resolveSalesSummary({ dateFrom: date_from, dateTo: date_to });

      return {
        content: [{ type: "text", text: JSON.stringify(summary) }],
      };
    }),
  );

  server.registerTool(
    "export_sales_excel",
    {
      title: "Export Sales Excel Report",
      description:
        "Generates an Excel (.xlsx) sales summary report for a date range, using the same fixed resolver as get_sales_summary.",
      inputSchema: dateRangeInput,
    },
    withToolLogging("export_sales_excel", async ({ date_from, date_to }) => {
      const summary = await resolveSalesSummary({ dateFrom: date_from, dateTo: date_to });
      const buffer = await generateSalesSummaryExcel(summary);
      const filename = `sales-summary-${date_from}-to-${date_to}.xlsx`;

      return {
        content: [
          {
            type: "resource",
            resource: {
              uri: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;name=${filename}`,
              mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              blob: buffer.toString("base64"),
            },
          },
          {
            type: "text",
            text: `Generated ${filename}: ${summary.order_count} orders, total ${summary.total_amount.toFixed(2)}.`,
          },
        ],
      };
    }),
  );

  server.registerTool(
    "export_sales_pdf",
    {
      title: "Export Sales PDF Report",
      description:
        "Generates a PDF sales summary report for a date range, using the same fixed resolver as get_sales_summary.",
      inputSchema: dateRangeInput,
    },
    withToolLogging("export_sales_pdf", async ({ date_from, date_to }) => {
      const summary = await resolveSalesSummary({ dateFrom: date_from, dateTo: date_to });
      const buffer = await generateSalesSummaryPdf(summary);
      const filename = `sales-summary-${date_from}-to-${date_to}.pdf`;

      return {
        content: [
          {
            type: "resource",
            resource: {
              uri: `data:application/pdf;name=${filename}`,
              mimeType: "application/pdf",
              blob: buffer.toString("base64"),
            },
          },
          {
            type: "text",
            text: `Generated ${filename}: ${summary.order_count} orders, total ${summary.total_amount.toFixed(2)}.`,
          },
        ],
      };
    }),
  );
}
