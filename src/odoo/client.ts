/**
 * Odoo 17 integration layer (Build Process Phase 7/12).
 *
 * Communicates with Odoo over its JSON-RPC external API. This is the only
 * module in the project that talks to Odoo directly — MCP tools must go
 * through the methods exposed here, never call Odoo themselves.
 *
 * Deliberately does NOT expose a generic "execute any method" function.
 * Callers pass a model + method + args, but only from tool code we write
 * ourselves (Section 13 of the build process: no arbitrary Odoo execution
 * reachable from Claude).
 */

interface OdooConfig {
  url: string;
  database: string;
  username: string;
  password: string;
}

function getConfig(): OdooConfig {
  const url = process.env.ODOO_URL;
  const database = process.env.ODOO_DATABASE;
  const username = process.env.ODOO_USERNAME;
  const password = process.env.ODOO_PASSWORD;

  if (!url || !database || !username || !password) {
    throw new Error(
      "Odoo is not configured. Set ODOO_URL, ODOO_DATABASE, ODOO_USERNAME, and ODOO_PASSWORD.",
    );
  }

  return { url: url.replace(/\/+$/, ""), database, username, password };
}

let cachedUid: number | null = null;
let cachedUidPromise: Promise<number> | null = null;

interface JsonRpcError {
  code: number;
  message: string;
  data?: { name?: string; message?: string; debug?: string };
}

async function jsonRpcCall<T>(url: string, service: string, method: string, args: unknown[]): Promise<T> {
  const response = await fetch(`${url}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
      id: Date.now(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Odoo request failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as { result?: T; error?: JsonRpcError };

  if (payload.error) {
    const detail = payload.error.data?.message ?? payload.error.message;
    throw new Error(`Odoo error: ${detail}`);
  }

  return payload.result as T;
}

async function authenticate(): Promise<number> {
  if (cachedUid !== null) {
    return cachedUid;
  }

  if (!cachedUidPromise) {
    const config = getConfig();
    cachedUidPromise = jsonRpcCall<number | false>(config.url, "common", "authenticate", [
      config.database,
      config.username,
      config.password,
      {},
    ]).then((uid) => {
      if (!uid) {
        cachedUidPromise = null;
        throw new Error("Odoo authentication failed: invalid database, username, or password.");
      }
      cachedUid = uid;
      return uid;
    });
  }

  return cachedUidPromise;
}

/**
 * Calls execute_kw for a given model/method with a fixed, small set of
 * operations tool code is allowed to use (see searchRead/read below).
 * Not exported directly — tools should use the typed helpers instead.
 */
async function executeKw<T>(model: string, method: string, args: unknown[], kwargs: Record<string, unknown> = {}): Promise<T> {
  const config = getConfig();
  const uid = await authenticate();

  return jsonRpcCall<T>(config.url, "object", "execute_kw", [
    config.database,
    uid,
    config.password,
    model,
    method,
    args,
    kwargs,
  ]);
}

export interface SearchReadOptions {
  domain?: unknown[];
  fields?: string[];
  limit?: number;
  offset?: number;
  order?: string;
}

/**
 * Read-only search + read against an Odoo model. This is the single
 * primitive MCP tools are built on for the initial read-only phase.
 */
export async function searchRead<T = Record<string, unknown>>(
  model: string,
  options: SearchReadOptions = {},
): Promise<T[]> {
  const { domain = [], fields, limit, offset, order } = options;

  return executeKw<T[]>(model, "search_read", [domain], {
    fields,
    limit,
    offset,
    order,
  });
}

/**
 * Reads specific records by id from an Odoo model, read-only.
 */
export async function read<T = Record<string, unknown>>(
  model: string,
  ids: number[],
  fields?: string[],
): Promise<T[]> {
  return executeKw<T[]>(model, "read", [ids], { fields });
}
