import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { SalesSummaryResult } from "@/src/reports/resolver";

const PAGE_WIDTH = 612; // US Letter, points
const PAGE_HEIGHT = 792;
const MARGIN = 48;
const ROW_HEIGHT = 16;

/**
 * Tool Executor step for PDF export (Build Process Phase 16). Renders a
 * resolved SalesSummaryResult into a .pdf file. Takes only already
 * -resolved figures — performs no independent calculation.
 */
export async function generateSalesSummaryPdf(summary: SalesSummaryResult): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const drawText = (text: string, x: number, options: { bold?: boolean; size?: number } = {}) => {
    page.drawText(text, {
      x,
      y,
      size: options.size ?? 10,
      font: options.bold ? boldFont : font,
      color: rgb(0, 0, 0),
    });
  };

  const newPageIfNeeded = () => {
    if (y < MARGIN + ROW_HEIGHT) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  };

  drawText("Odoo Sales Summary", MARGIN, { bold: true, size: 16 });
  y -= 24;
  drawText(`Period: ${summary.date_from} to ${summary.date_to}`, MARGIN, { size: 11 });
  y -= 16;
  drawText(`Orders: ${summary.order_count}    Total: ${summary.total_amount.toFixed(2)}`, MARGIN, {
    bold: true,
    size: 11,
  });
  y -= 24;

  const columns = [
    { label: "Reference", x: MARGIN, width: 90 },
    { label: "Customer", x: MARGIN + 90, width: 200 },
    { label: "Date", x: MARGIN + 290, width: 90 },
    { label: "Status", x: MARGIN + 380, width: 60 },
    { label: "Amount", x: MARGIN + 440, width: 80 },
  ];

  for (const col of columns) {
    page.drawText(col.label, { x: col.x, y, size: 10, font: boldFont, color: rgb(0, 0, 0) });
  }
  y -= ROW_HEIGHT;

  for (const order of summary.orders) {
    newPageIfNeeded();
    const values = [
      order.reference,
      (order.customer ?? "").slice(0, 34),
      order.date_order ?? "",
      order.status,
      order.amount_total.toFixed(2),
    ];
    columns.forEach((col, i) => {
      page.drawText(values[i], { x: col.x, y, size: 9, font, color: rgb(0, 0, 0) });
    });
    y -= ROW_HEIGHT;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
