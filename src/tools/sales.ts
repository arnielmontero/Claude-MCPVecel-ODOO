import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { searchRead, read } from "@/src/odoo/client";

interface SaleOrder {
  id: number;
  name: string;
  partner_id: [number, string] | false;
  date_order: string | false;
  amount_total: number;
  state: string;
}

interface SaleOrderLine {
  id: number;
  product_id: [number, string] | false;
  product_uom_qty: number;
  price_unit: number;
  price_subtotal: number;
}

/**
 * Sales order MCP tools (Build Process Phase 13). Read-only, backed by
 * Odoo's sale.order / sale.order.line models via src/odoo/client.ts.
 */
export function registerSalesTools(server: McpServer) {
  server.registerTool(
    "search_sales_orders",
    {
      title: "Search Sales Orders",
      description:
        "Searches Odoo sales orders (sale.order) by order reference or customer name. Returns order summaries.",
      inputSchema: z.object({
        search_term: z
          .string()
          .min(1)
          .describe("Text to search for in the order reference (e.g. S00123) or customer name."),
        limit: z.number().int().min(1).max(50).default(10).describe("Maximum number of results to return."),
      }),
    },
    async ({ search_term, limit }) => {
      const orders = await searchRead<SaleOrder>("sale.order", {
        domain: [
          "|",
          ["name", "ilike", search_term],
          ["partner_id.name", "ilike", search_term],
        ],
        fields: ["id", "name", "partner_id", "date_order", "amount_total", "state"],
        limit,
        order: "date_order desc",
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              sales_orders: orders.map((o) => ({
                id: o.id,
                reference: o.name,
                customer: o.partner_id ? o.partner_id[1] : null,
                date_order: o.date_order || null,
                amount_total: o.amount_total,
                status: o.state,
              })),
            }),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_sales_order",
    {
      title: "Get Sales Order",
      description:
        "Retrieves full details, including line items, for a single Odoo sales order (sale.order) by id.",
      inputSchema: z.object({
        order_id: z.number().int().positive().describe("The Odoo sale.order id."),
      }),
    },
    async ({ order_id }) => {
      const orders = await read<SaleOrder>("sale.order", [order_id], [
        "id",
        "name",
        "partner_id",
        "date_order",
        "amount_total",
        "state",
      ]);

      if (orders.length === 0) {
        return {
          isError: true,
          content: [{ type: "text", text: `No sales order found with id ${order_id}.` }],
        };
      }

      const order = orders[0];

      const lines = await searchRead<SaleOrderLine>("sale.order.line", {
        domain: [["order_id", "=", order_id]],
        fields: ["id", "product_id", "product_uom_qty", "price_unit", "price_subtotal"],
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: order.id,
              reference: order.name,
              customer: order.partner_id ? order.partner_id[1] : null,
              date_order: order.date_order || null,
              amount_total: order.amount_total,
              status: order.state,
              lines: lines.map((l) => ({
                product: l.product_id ? l.product_id[1] : null,
                quantity: l.product_uom_qty,
                unit_price: l.price_unit,
                subtotal: l.price_subtotal,
              })),
            }),
          },
        ],
      };
    },
  );
}
