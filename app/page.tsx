export default function Home() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: "3rem", maxWidth: 640 }}>
      <h1>Odoo MCP Server</h1>
      <p>
        Controlled MCP bridge between Claude Pro and Odoo 17. This app has no
        end-user UI &mdash; it exposes an MCP endpoint for MCP clients.
      </p>
      <p>
        MCP endpoint: <code>/api/mcp</code>
      </p>
    </main>
  );
}
