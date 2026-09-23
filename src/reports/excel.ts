import ExcelJS from "exceljs";
import type { SalesSummaryResult } from "@/src/reports/resolver";

/**
 * Tool Executor step for Excel export (Build Process Phase 16). Renders a
 * resolved SalesSummaryResult into an .xlsx file. Takes only already
 * -resolved figures — performs no independent calculation.
 */
export async function generateSalesSummaryExcel(summary: SalesSummaryResult): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Odoo MCP Server";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Sales Summary");

  sheet.columns = [
    { header: "Order Reference", key: "reference", width: 20 },
    { header: "Customer", key: "customer", width: 32 },
    { header: "Date", key: "date_order", width: 20 },
    { header: "Status", key: "status", width: 12 },
    { header: "Amount Total", key: "amount_total", width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const order of summary.orders) {
    sheet.addRow({
      reference: order.reference,
      customer: order.customer ?? "",
      date_order: order.date_order ?? "",
      status: order.status,
      amount_total: order.amount_total,
    });
  }

  sheet.addRow({});
  const totalRow = sheet.addRow({
    reference: `Period: ${summary.date_from} to ${summary.date_to}`,
    status: "TOTAL",
    amount_total: summary.total_amount,
  });
  totalRow.font = { bold: true };

  sheet.getColumn("amount_total").numFmt = "#,##0.00";

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
