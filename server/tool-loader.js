import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function loadCustomTools(toolsDir = path.resolve(process.cwd(), "tools")) {
  if (!fs.existsSync(toolsDir)) return [];
  const files = fs
    .readdirSync(toolsDir)
    .filter((f) => f.endsWith(".js") || f.endsWith(".mjs"))
    .sort();

  const loaded = [];
  for (const file of files) {
    const fullPath = path.join(toolsDir, file);
    const mod = await import(`${pathToFileURL(fullPath).href}?t=${Date.now()}`);
    const list = Array.isArray(mod.customTools)
      ? mod.customTools
      : Array.isArray(mod.default)
      ? mod.default
      : mod.tool
      ? [mod.tool]
      : [];

    for (const item of list) {
      if (item && typeof item.name === "string" && typeof item.run === "function") {
        loaded.push({
          name: item.name,
          description: item.description || `Custom workspace tool ${item.name}`,
          inputSchema: item.inputSchema || { type: "object", properties: {} },
          run: item.run
        });
      }
    }
  }
  return loaded;
}
