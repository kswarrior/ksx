import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({ name: "ksx-mcp-test", version: "1.0.0" });
await client.connect(
  new StdioClientTransport({ command: "node", args: ["mcp/ksx-server.mjs"], stderr: "inherit" })
);

const stats = await client.callTool({ name: "ksx_api_get", arguments: { path: "/api/stats" } });
console.log("API_GET", stats.content[0].text.slice(0, 200));

const filtered = await client.callTool({
  name: "ksx_api_get",
  arguments: { path: "/api/hosting/vps?alwaysOn=true" },
});
console.log("API_FILTER", filtered.content[0].text.slice(0, 200));

const bad = await client.callTool({ name: "ksx_api_get", arguments: { path: "/api/../secret" } });
console.log("TRAVERSAL_BLOCKED", bad.isError === true);

await client.close();
