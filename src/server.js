import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = process.cwd();
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

function serveStaticFile(filePath, res) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(COMPLEX_UI_DIR + path.sep) && resolved !== COMPLEX_UI_DIR) {
    res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Forbidden" }));
    return;
  }

  fs.stat(resolved, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Not Found", path: resolved }));
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

  if (pathname === "/ui/complex-console" || pathname === "/ui/complex-console/") {
    serveStaticFile(path.join(COMPLEX_UI_DIR, "index.html"), res);
    return;
  }

  if (pathname.startsWith("/ui/complex-console/")) {
    const relPath = pathname.slice("/ui/complex-console/".length);
    serveStaticFile(path.join(COMPLEX_UI_DIR, relPath), res);
    return;
  }

  if (pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ status: "ok", complexConsole: "/ui/complex-console/" }));
    return;
  }

  const fallbackIndex = path.join(ROOT_DIR, "index.html");
  if (pathname === "/" && fs.existsSync(fallbackIndex)) {
    serveStaticFile(fallbackIndex, res);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ error: "Not Found", method: req.method, path: pathname }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on http://0.0.0.0:${PORT} (Complex UI: /ui/complex-console/)`);
});
