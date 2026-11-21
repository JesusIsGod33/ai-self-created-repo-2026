import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = process.cwd();
const FULL_SITE_DIR = path.resolve(ROOT_DIR, "ui/full-site");
const RESUME_UI_DIR = path.resolve(ROOT_DIR, "ui/resume-site");
const COMPLEX_UI_DIR = path.resolve(ROOT_DIR, "ui/complex-console");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon"
};

function sendFileFrom(baseDir, relPath, res) {
  const cleanRel = relPath.replace(/^\/+/, "") || "index.html";
  const resolved = path.resolve(baseDir, cleanRel);
  if (!resolved.startsWith(baseDir + path.sep) && resolved !== baseDir) {
    res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Forbidden" }));
    return;
  }

  fs.stat(resolved, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Not Found", path: cleanRel }));
      return;
    }

    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(resolved).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
  const pathname = reqUrl.pathname;

  if (pathname === "/full-site" || pathname === "/full-site/") {
    sendFileFrom(FULL_SITE_DIR, "index.html", res);
    return;
  }

  if (pathname.startsWith("/full-site/")) {
    sendFileFrom(FULL_SITE_DIR, pathname.slice("/full-site/".length), res);
    return;
  }

  if (pathname === "/resume" || pathname === "/resume/") {
    sendFileFrom(RESUME_UI_DIR, "index.html", res);
    return;
  }

  if (pathname.startsWith("/resume/")) {
    sendFileFrom(RESUME_UI_DIR, pathname.slice("/resume/".length), res);
    return;
  }

  if (pathname === "/ui/complex-console" || pathname === "/ui/complex-console/") {
    sendFileFrom(COMPLEX_UI_DIR, "index.html", res);
    return;
  }

  if (pathname.startsWith("/ui/complex-console/")) {
    sendFileFrom(COMPLEX_UI_DIR, pathname.slice("/ui/complex-console/".length), res);
    return;
  }

  if (pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ status: "ok", fullSite: "/", resume: "/resume", complexConsole: "/ui/complex-console/" }));
    return;
  }

  if (pathname === "/" || pathname === "/index.html") {
    sendFileFrom(FULL_SITE_DIR, "index.html", res);
    return;
  }

  if (["/styles.css", "/app.js", "/site-manifest.json"].includes(pathname)) {
    sendFileFrom(FULL_SITE_DIR, pathname.slice(1), res);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ error: "Not Found", method: req.method, path: pathname }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
