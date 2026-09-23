import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { searchRead, read } from "@/src/odoo/client";
import { withToolLogging } from "@/src/security/logger";

interface Partner {
  id: number;
  name: string;
  email: string | false;
  phone: string | false;
  is_company: boolean;
}

/**
 * Customer-related MCP tools (Build Process Phase 13). Read-only,
 * backed by Odoo's res.partner model via src/odoo/client.ts.
 */
export function registerCustomerTools(server: McpServer) {
  server.registerTool(
    "search_customers",
    {
      title: "Search Customers",
      description:
        "Searches Odoo customers (res.partner) by name, email, or phone. Returns basic customer information.",
      inputSchema: z.object({
        search_term: z.string().min(1).describe("Text to search for in the customer's name, email, or phone."),
        limit: z.number().int().min(1).max(50).default(10).describe("Maximum number of results to return."),
      }),
    },
    withToolLogging("search_customers", async ({ search_term, limit }) => {
      const customers = await searchRead<Partner>("res.partner", {
        domain: [
          ["customer_rank", ">", 0],
          "|",
          "|",
          ["name", "ilike", search_term],
          ["email", "ilike", search_term],
          ["phone", "ilike", search_term],
        ],
        fields: ["id", "name", "email", "phone", "is_company"],
        limit,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              customers: customers.map((c) => ({
                id: c.id,
                name: c.name,
                email: c.email || null,
                phone: c.phone || null,
                is_company: c.is_company,
              })),
            }),
          },
        ],
      };
    }),
  );

  server.registerTool(
    "get_customer",
    {
      title: "Get Customer",
      description: "Retrieves full details for a single Odoo customer (res.partner) by id.",
      inputSchema: z.object({
        customer_id: z.number().int().positive().describe("The Odoo res.partner id of the customer."),
      }),
    },
    withToolLogging("get_customer", async ({ customer_id }) => {
      const results = await read<Partner>("res.partner", [customer_id], [
        "id",
        "name",
        "email",
        "phone",
        "is_company",
      ]);

      if (results.length === 0) {
        return {
          isError: true,
          content: [{ type: "text", text: `No customer found with id ${customer_id}.` }],
        };
      }

      const c = results[0];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: c.id,
              name: c.name,
              email: c.email || null,
              phone: c.phone || null,
              is_company: c.is_company,
            }),
          },
        ],
      };
    }),
  );
}
