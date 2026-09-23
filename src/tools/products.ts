import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { searchRead, read } from "@/src/odoo/client";
import { withToolLogging } from "@/src/security/logger";

interface Product {
  id: number;
  name: string;
  default_code: string | false;
  list_price: number;
  qty_available: number;
  active: boolean;
}

/**
 * Product-related MCP tools (Build Process Phase 13). Read-only,
 * backed by Odoo's product.product model via src/odoo/client.ts.
 */
export function registerProductTools(server: McpServer) {
  server.registerTool(
    "search_products",
    {
      title: "Search Products",
      description:
        "Searches Odoo products (product.product) by name or internal reference. Returns basic product information.",
      inputSchema: z.object({
        search_term: z.string().min(1).describe("Text to search for in the product's name or internal reference."),
        limit: z.number().int().min(1).max(50).default(10).describe("Maximum number of results to return."),
      }),
    },
    withToolLogging("search_products", async ({ search_term, limit }) => {
      const products = await searchRead<Product>("product.product", {
        domain: [
          "|",
          ["name", "ilike", search_term],
          ["default_code", "ilike", search_term],
        ],
        fields: ["id", "name", "default_code", "list_price", "qty_available", "active"],
        limit,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              products: products.map((p) => ({
                id: p.id,
                name: p.name,
                reference: p.default_code || null,
                list_price: p.list_price,
                qty_available: p.qty_available,
              })),
            }),
          },
        ],
      };
    }),
  );

  server.registerTool(
    "get_product",
    {
      title: "Get Product",
      description: "Retrieves full details for a single Odoo product (product.product) by id.",
      inputSchema: z.object({
        product_id: z.number().int().positive().describe("The Odoo product.product id."),
      }),
    },
    withToolLogging("get_product", async ({ product_id }) => {
      const results = await read<Product>("product.product", [product_id], [
        "id",
        "name",
        "default_code",
        "list_price",
        "qty_available",
        "active",
      ]);

      if (results.length === 0) {
        return {
          isError: true,
          content: [{ type: "text", text: `No product found with id ${product_id}.` }],
        };
      }

      const p = results[0];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: p.id,
              name: p.name,
              reference: p.default_code || null,
              list_price: p.list_price,
              qty_available: p.qty_available,
              active: p.active,
            }),
          },
        ],
      };
    }),
  );
}
