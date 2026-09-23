# Odoo MCP Server

A controlled MCP (Model Context Protocol) bridge between Claude Pro and
Odoo 17, deployed on Vercel as a Next.js application.

```text
Claude Pro → MCP/HTTPS → Vercel (Next.js, MCP Server) → Odoo API → Odoo 17
```

See [MCP_Server_to_Odoo_17_Claude_Pro_Build_Process.md](./MCP_Server_to_Odoo_17_Claude_Pro_Build_Process.md)
for the full build plan and architectural rules this project follows.

## Status

- [x] Phase 1 — GitHub repository
- [x] Phase 2 — Vercel-ready Next.js application
- [x] Phase 3 — Smallest MCP server (`hello()` tool)
- [x] Phase 4 — Verified with MCP Inspector
- [x] Phase 5 — Additional test tools (`get_server_status`, `get_current_time`, `calculate`)
- [x] Phase 6 — MCP tool architecture (module layout in place)
- [x] Phase 7 — Connect MCP Server to Odoo (read-only, verified in production)
- [x] Phase 13 (partial) — `search_customers`, `get_customer`, `search_products`,
      `get_product`, `search_sales_orders`, `get_sales_order`
- [x] Phase 8 — Reporting tools: `get_sales_summary`, `export_sales_excel`,
      `export_sales_pdf` via a fixed resolver (`src/reports/resolver.ts`).
      Verified against production Odoo data, including opening/parsing the
      generated .xlsx and .pdf files.
- [x] Phase 9 — Security: bearer token auth (required, fails closed),
      structured per-tool-call logging, best-effort rate limiting
      (see note below)
- [ ] Phase 10 — Claude Pro remote MCP connection

## Development

```bash
npm install
npm run dev
```

The MCP endpoint is served at `http://localhost:3000/api/mcp`.

## Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector@latest --cli http://localhost:3000/api/mcp --method tools/list
npx @modelcontextprotocol/inspector@latest --cli http://localhost:3000/api/mcp --method tools/call --tool-name hello
```

## Project structure

```text
app/
  api/mcp/route.ts    MCP endpoint (mounts the MCP handler)
  page.tsx            Minimal landing page (no end-user UI)
src/
  tools/              MCP tool definitions, grouped by domain
  odoo/               Odoo integration client (Phase 7+)
  reports/            Fixed report resolver (Phase 8+)
  security/           Auth/authorization (Phase 9+)
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in real Odoo credentials for
local development. Real credentials are never committed — production
values live in Vercel Environment Variables.

## Security principles

- Read-only Odoo access initially.
- No arbitrary Odoo model/method execution exposed as a tool.
- No direct PostgreSQL access from Claude.
- Report figures are always resolved through a fixed backend path against
  Odoo — never computed by the LLM.
- The MCP endpoint requires a bearer token (`MCP_AUTH_TOKEN`) and fails
  closed if it isn't configured.

### Rate limiting is best-effort, not a hard guarantee

`src/security/rateLimit.ts` is an in-memory sliding-window limiter
(60 requests/minute per authenticated client). This works correctly in
local development and on a single long-lived server, but **Vercel's
serverless runtime spreads requests across multiple isolated function
instances, each with its own empty in-memory counter** — confirmed by a
65-request burst against production that saw no 429s, versus the same
burst locally correctly returning 429 after request 60. In production
this still helps against a tight retry loop that happens to stay pinned
to one warm instance, but it does not enforce a true cross-instance
ceiling. A real fix requires a shared store (Vercel KV / Upstash Redis)
keyed by client id — not implemented yet, since there is exactly one
authorized client (Claude Pro) rather than public traffic.
