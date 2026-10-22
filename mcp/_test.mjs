import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({ name: "ksx-mcp-test", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: "node",
  args: ["mcp/ksx-server.mjs"],
  stderr: "inherit",
});

await client.connect(transport);

const tools = await client.listTools();
console.log("TOOLS", tools.tools.map((t) => t.name).join(", "));

const summary = await client.callTool({ name: "ksx_site_summary", arguments: {} });
const parsed = JSON.parse(summary.content[0].text);
console.log("SUMMARY", JSON.stringify({ counts: parsed.counts, categories: parsed.categories }));

const search = await client.callTool({ name: "ksx_search_pages", arguments: { query: "hosting" } });
console.log("SEARCH", JSON.parse(search.content[0].text).count);

const mc = await client.callTool({
  name: "ksx_find_minecraft_hosting",
  arguments: { minRam: 8, location: "Germany" },
});
const mcJson = JSON.parse(mc.content[0].text);
console.log("MC", mcJson.count, mcJson.data.map((h) => `${h.name}:${h.ram}`).join(", "));

const vps = await client.callTool({
  name: "ksx_find_vps_hosting",
  arguments: { alwaysOn: true, sudo: true },
});
const vpsJson = JSON.parse(vps.content[0].text);
console.log("VPS", vpsJson.count, vpsJson.data.map((h) => h.name).join(", "));

const sitemap = await client.readResource({ uri: "ksx://sitemap" });
console.log("RESOURCE", sitemap.contents[0].mimeType, sitemap.contents[0].text.length, "bytes");

await client.close();
