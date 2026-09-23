import { searchRead } from "@/src/odoo/client";

/**
 * Fixed sales report resolver (Build Process Phase 4/8/15).
 *
 * This is the ONLY place that computes report figures. Report totals are
 * always produced by aggregating real Odoo records here — never by the
 * LLM's own reasoning. MCP report tools call these functions and pass the
 * result straight through; they must not recompute or adjust the numbers.
 */

interface SaleOrderRecord {
  id: number;
  name: string;
  partner_id: [number, string] | false;
  date_order: string | false;
  amount_total: number;
  state: string;
}

export interface SalesSummaryParams {
  dateFrom: string;
  dateTo: string;
}

export interface SalesSummaryLine {
  order_id: number;
  reference: string;
  customer: string | null;
  date_order: string | null;
  amount_total: number;
  status: string;
}

export interface SalesSummaryResult {
  date_from: string;
  date_to: string;
  order_count: number;
  total_amount: number;
  orders: SalesSummaryLine[];
}

const CONFIRMED_STATES = ["sale", "done"];

/**
 * Resolves confirmed sales orders within a date range and their total.
 * "Confirmed" means Odoo state sale/done — draft/sent/cancelled orders are
 * excluded from the revenue total, matching how Odoo itself reports sales.
 */
export async function resolveSalesSummary(params: SalesSummaryParams): Promise<SalesSummaryResult> {
  const { dateFrom, dateTo } = params;

  const orders = await searchRead<SaleOrderRecord>("sale.order", {
    domain: [
      ["date_order", ">=", `${dateFrom} 00:00:00`],
      ["date_order", "<=", `${dateTo} 23:59:59`],
      ["state", "in", CONFIRMED_STATES],
    ],
    fields: ["id", "name", "partner_id", "date_order", "amount_total", "state"],
    order: "date_order asc",
  });

  const total = orders.reduce((sum, o) => sum + o.amount_total, 0);

  return {
    date_from: dateFrom,
    date_to: dateTo,
    order_count: orders.length,
    total_amount: Math.round(total * 100) / 100,
    orders: orders.map((o) => ({
      order_id: o.id,
      reference: o.name,
      customer: o.partner_id ? o.partner_id[1] : null,
      date_order: o.date_order || null,
      amount_total: o.amount_total,
      status: o.state,
    })),
  };
}
