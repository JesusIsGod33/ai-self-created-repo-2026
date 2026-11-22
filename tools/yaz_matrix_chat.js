import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const ROOT_DIR = "/home/Woken/career-orchestrator-stack";
const CHAT_DIR = path.join(ROOT_DIR, "data", "yaz-chat");
const HISTORY_PATH = path.join(CHAT_DIR, "session-history.json");

function readHistory() {
  fs.mkdirSync(CHAT_DIR, { recursive: true });
  if (!fs.existsSync(HISTORY_PATH)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(entries) {
  fs.mkdirSync(CHAT_DIR, { recursive: true });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(entries.slice(-200), null, 2), "utf8");
}

async function askLocalOllama(prompt, history) {
  const baseUrl = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
  const model = process.env.YAZ_CHAT_MODEL || process.env.OLLAMA_MODEL || "qwen2.5:1.5b";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  const messages = [
    {
      role: "system",
      content: "You are YAZ, a local Linux and orchestration assistant. Keep responses concise and technical."
    },
    ...history.slice(-8).map((m) => ({
      role: m.role === "yaz" ? "assistant" : "user",
      content: String(m.text || "")
    })),
    { role: "user", content: prompt }
  ];

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: false }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) {
      return `[YAZ-NODE // OFFLINE-FALLBACK] Ollama returned HTTP ${res.status}. Prompt logged: "${prompt}"`;
    }
    const data = await res.json();
    return data?.message?.content?.trim() || `[YAZ-${model}] Empty response received.`;
  } catch {
    clearTimeout(timer);
    return `[YAZ-LOCAL // STANDALONE] Local Ollama unreachable at ${baseUrl}. Logged: "${prompt}". Use /status or /clear.`;
  }
}

function renderChatHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>YAZ Chat</title>
<style>
  body { font-family: monospace; background: #111; color: #eee; max-width: 900px; margin: 24px auto; padding: 0 16px; }
  #messages { border: 1px solid #444; padding: 12px; height: 60vh; overflow-y: auto; margin-bottom: 12px; background: #181818; }
  .msg { margin-bottom: 10px; padding: 8px; border-left: 3px solid #666; }
  .msg.user { border-left-color: #6cf; }
  .msg.yaz { border-left-color: #6f6; }
  .meta { font-size: 11px; color: #aaa; margin-bottom: 4px; }
  form { display: flex; gap: 8px; }
  input { flex: 1; padding: 8px; background: #222; color: #fff; border: 1px solid #555; font-family: monospace; }
  button { padding: 8px 14px; background: #2b2b2b; color: #fff; border: 1px solid #666; font-family: monospace; cursor: pointer; }
  .toolbar { display: flex; gap: 8px; margin-bottom: 10px; }
</style>
</head>
<body>
<h2>YAZ Chat (127.0.0.1)</h2>
<div class="toolbar">
  <button type="button" data-cmd="/status">/status</button>
  <button type="button" data-cmd="/clear">/clear</button>
</div>
<div id="messages"></div>
<form id="chat-form">
  <input id="prompt-input" type="text" autocomplete="off" placeholder="Enter message or /status, /clear..." />
  <button type="submit">Send</button>
</form>
<script>
const messagesEl = document.getElementById("messages");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("prompt-input");

function appendMessage(role, text, ts) {
  const wrap = document.createElement("div");
  wrap.className = "msg " + role;
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = role + " @ " + (ts || new Date().toISOString());
  const body = document.createElement("div");
  body.textContent = text;
  wrap.appendChild(meta);
  wrap.appendChild(body);
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function loadHistory() {
  const res = await fetch("/api/history", { cache: "no-store" });
  const data = await res.json();
  messagesEl.innerHTML = "";
  const items = Array.isArray(data.messages) ? data.messages : [];
  if (items.length === 0) {
    appendMessage("yaz", "Ready.", new Date().toISOString());
    return;
  }
  for (const m of items) appendMessage(m.role, m.text, m.ts);
}

async function sendPrompt(text) {
  const clean = text.trim();
  if (!clean) return;
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: clean })
  });
  const data = await res.json();
  if (data.cleared) {
    messagesEl.innerHTML = "";
    appendMessage("yaz", "History cleared.", new Date().toISOString());
    return;
  }
  await loadHistory();
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const val = inputEl.value;
  inputEl.value = "";
  await sendPrompt(val);
});

document.querySelectorAll("button[data-cmd]").forEach((btn) => {
  btn.addEventListener("click", () => sendPrompt(btn.dataset.cmd || ""));
});

loadHistory();
</script>
</body>
</html>`;
}

const activeServers = new Map();

function isPortListening(port) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/history",
        timeout: 1000,
        headers: { Connection: "close" }
      },
      (res) => {
        res.resume();
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      }
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

function startChatServer(port) {
  if (activeServers.has(port)) {
    return Promise.resolve({ port, url: `http://127.0.0.1:${port}`, alreadyRunning: true });
  }

  const server = http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url || "/", `http://127.0.0.1:${port}`);

    if (req.method === "GET" && reqUrl.pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(renderChatHtml());
      return;
    }

    if (req.method === "GET" && reqUrl.pathname === "/api/history") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, messages: readHistory() }));
      return;
    }

    if (req.method === "POST" && reqUrl.pathname === "/api/chat") {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 65536) break;
      }
      let parsed = {};
      try {
        parsed = JSON.parse(raw || "{}");
      } catch {
        parsed = {};
      }
      const prompt = String(parsed.prompt || "").trim();
      if (!prompt) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Empty prompt" }));
        return;
      }

      if (prompt === "/clear") {
        writeHistory([]);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, cleared: true }));
        return;
      }

      const history = readHistory();
      const now = new Date().toISOString();
      const userMsg = { role: "user", text: prompt, ts: now };

      const replyText = prompt === "/status"
        ? `[YAZ-STATUS] Uptime: ${Math.floor(process.uptime())}s | Port: ${port} | HistoryEntries: ${history.length + 1}`
        : await askLocalOllama(prompt, history);

      const yazMsg = { role: "yaz", text: replyText, ts: new Date().toISOString() };
      writeHistory([...history, userMsg, yazMsg]);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, message: yazMsg }));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "Not found" }));
  });

  server.keepAliveTimeout = 1000;
  server.headersTimeout = 1500;
  server.requestTimeout = 4000;

  const cleanup = () => {
    for (const [p, srv] of activeServers.entries()) {
      try {
        srv.close();
      } catch {}
      activeServers.delete(p);
    }
  };
  process.once("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.once("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });

  activeServers.set(port, server);
  return new Promise((resolve, reject) => {
    server.on("error", (err) => {
      activeServers.delete(port);
      reject(err);
    });
    server.listen(port, "127.0.0.1", () => {
      resolve({ port, url: `http://127.0.0.1:${port}`, alreadyRunning: false });
    });
  });
}

export const customTools = [
  {
    name: "yaz_matrix_chat",
    description: "Launch or query the local Yaz chat UI on 127.0.0.1.",
    inputSchema: {
      type: "object",
      properties: {
        port: { type: "number", description: "Loopback port for the chat UI server (default 4090)." },
        prompt: { type: "string", description: "Optional initial chat prompt to send immediately." },
        keepAliveMs: { type: "number", description: "Optional duration in ms to keep standalone process alive (default 0)." }
      }
    },
    async run(args = {}) {
      const port = Number.isFinite(Number(args.port))
        ? Math.max(1024, Math.min(65535, Number(args.port)))
        : 4090;
      const keepAliveMs = Number.isFinite(Number(args.keepAliveMs))
        ? Math.max(0, Math.min(86400000, Number(args.keepAliveMs)))
        : 0;

      const alreadyUp = await isPortListening(port);
      const srv = alreadyUp
        ? { port, url: `http://127.0.0.1:${port}`, alreadyRunning: true }
        : await startChatServer(port);

      let initialReply = null;

      if (args.prompt && String(args.prompt).trim()) {
        const prompt = String(args.prompt).trim();
        const history = readHistory();
        const userMsg = { role: "user", text: prompt, ts: new Date().toISOString() };
        const replyText = prompt === "/status"
          ? `[YAZ-STATUS] Uptime: ${Math.floor(process.uptime())}s | Port: ${port} | HistoryEntries: ${history.length + 1}`
          : await askLocalOllama(prompt, history);
        const yazMsg = { role: "yaz", text: replyText, ts: new Date().toISOString() };
        writeHistory([...history, userMsg, yazMsg]);
        initialReply = yazMsg;
      }

      if (keepAliveMs > 0) {
        await new Promise((r) => setTimeout(r, keepAliveMs));
      }

      return {
        ok: true,
        url: srv.url,
        port: srv.port,
        alreadyRunning: Boolean(srv.alreadyRunning),
        historyPath: HISTORY_PATH,
        initialReply
      };
    }
  }
];
