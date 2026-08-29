import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const apiBase = "https://api.cloudflare.com/client/v4";

async function readToken() {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;

  const appData = process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
  const configPath = path.join(appData, "xdg.config", ".wrangler", "config", "default.toml");
  const config = await fs.readFile(configPath, "utf8");
  const token = config.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
  if (!token) throw new Error("Cloudflare token not found");
  return token;
}

const token = await readToken();
const [fqdn, content, mode = "plan"] = process.argv.slice(2);
if (!fqdn || !content || !["plan", "apply"].includes(mode)) {
  throw new Error("Usage: node deploy/manage-game-dns.mjs <fqdn> <ipv4> [plan|apply]");
}

const zoneName = fqdn.split(".").slice(-2).join(".");
const proxied = process.env.CLOUDFLARE_PROXY !== "false";

async function apiRequest(apiPath, options = {}) {
  const response = await fetch(`${apiBase}${apiPath}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const body = await response.json();
  if (!response.ok || !body.success) {
    const errors = (body.errors ?? []).map(({ code, message }) => `${code}:${message}`).join("; ");
    throw new Error(`${options.method ?? "GET"} ${apiPath} failed: HTTP ${response.status}; ${errors}`);
  }
  return body;
}

const zones = (await apiRequest(`/zones?name=${encodeURIComponent(zoneName)}&status=active&per_page=5`)).result;
if (zones.length !== 1) throw new Error(`Expected one active ${zoneName} zone, found ${zones.length}`);
const zoneId = zones[0].id;
const query = new URLSearchParams({ name: fqdn, per_page: "100" });
const records = (await apiRequest(`/zones/${zoneId}/dns_records?${query}`)).result;
if (records.length > 1) throw new Error(`Multiple DNS records exist for ${fqdn}`);

const desired = {
  type: "A",
  name: fqdn,
  content,
  ttl: 1,
  proxied,
  comment: "OH Haolema token ranking game",
};

if (records.length === 0) {
  console.log(JSON.stringify({ name: fqdn, action: mode === "apply" ? "created" : "create", content, proxied }));
  if (mode === "apply") await apiRequest(`/zones/${zoneId}/dns_records`, { method: "POST", body: JSON.stringify(desired) });
} else {
  const record = records[0];
  const matches = record.type === desired.type && record.content === content && record.proxied === proxied;
  if (matches) {
    console.log(JSON.stringify({ name: fqdn, action: "unchanged", content, proxied }));
  } else {
    console.log(JSON.stringify({ name: fqdn, action: mode === "apply" ? "updated" : "update", content, proxied }));
    if (mode === "apply") {
      await apiRequest(`/zones/${zoneId}/dns_records/${record.id}`, {
        method: "PUT",
        body: JSON.stringify(desired),
      });
    }
  }
}
