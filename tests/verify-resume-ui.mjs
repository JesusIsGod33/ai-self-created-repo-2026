import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const rootDir = "/home/Woken/career-orchestrator-stack";
const html = fs.readFileSync(path.join(rootDir, "public/index.html"), "utf8");
const css = fs.readFileSync(path.join(rootDir, "public/styles.css"), "utf8");
const js = fs.readFileSync(path.join(rootDir, "public/app.js"), "utf8");

const requiredButtons = [
  "btn-mode-executive",
  "btn-mode-technical",
  "btn-accent-slate",
  "btn-accent-emerald",
  "btn-theme-paper",
  "btn-theme-obsidian",
  "btn-sync-tools",
  "btn-run-diagnostics",
  "btn-copy-markdown",
  "btn-print-pdf",
  "btn-toggle-edit",
  "btn-reset-resume",
  "btn-skill-all",
  "btn-skill-infra",
  "btn-skill-automation",
  "btn-skill-security",
  "btn-add-experience",
  "btn-toggle-metrics",
  "btn-refresh-modules"
];

for (const id of requiredButtons) {
  assert.ok(html.includes(`id="${id}"`), `Missing button id: ${id}`);
}

const actionMatches = [...html.matchAll(/data-action="([^"]+)"/g)].map((m) => m[1]);
assert.ok(actionMatches.length >= 19, `Expected >= 19 interactive buttons, found ${actionMatches.length}`);

for (const action of new Set(actionMatches)) {
  assert.ok(js.includes(`"${action}"`), `Missing JS handler for action: ${action}`);
}

assert.ok(css.includes("@media print"), "Missing print stylesheet for PDF resume export");
assert.ok(css.includes(".resume-sheet"), "Missing resume sheet layout styles");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8"
};

const testServer = http.createServer((req, res) => {
  const reqPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const filePath = path.join(rootDir, "public", reqPath);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise((resolve) => testServer.listen(0, "127.0.0.1", resolve));
const { port } = testServer.address();

for (const route of ["/", "/styles.css", "/app.js"]) {
  const response = await fetch(`http://127.0.0.1:${port}${route}`, {
    signal: AbortSignal.timeout(3000)
  });
  assert.equal(response.status, 200, `Expected HTTP 200 for ${route}`);
}

testServer.close();
console.log(`UI_BUTTON_AND_ASSET_TEST_PASS buttons=${actionMatches.length}`);
