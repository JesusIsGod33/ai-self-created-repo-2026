import fs from "node:fs";
import path from "node:path";

function extractHtmlStructure(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";

  const links = [];
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    links.push({
      href: m[1].trim(),
      text: m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 120)
    });
  }

  const scripts = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1] || "";
    const srcMatch = attrs.match(/\bsrc=["']([^"']+)["']/i);
    const inlineBody = (m[2] || "").trim();
    scripts.push({
      src: srcMatch ? srcMatch[1].trim() : null,
      inlineBytes: Buffer.byteLength(inlineBody, "utf8"),
      hasModuleAttr: /\btype=["']module["']/i.test(attrs)
    });
  }

  const forms = [];
  for (const m of html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)) {
    const attrs = m[1] || "";
    const actionMatch = attrs.match(/\baction=["']([^"']*)["']/i);
    const methodMatch = attrs.match(/\bmethod=["']([^"']*)["']/i);
    const inputs = [];
    for (const inp of m[2].matchAll(/<(input|button|select|textarea)\b([^>]*)>/gi)) {
      const nameMatch = inp[2].match(/\bname=["']([^"']+)["']/i);
      const typeMatch = inp[2].match(/\btype=["']([^"']+)["']/i);
      inputs.push({
        tag: inp[1].toLowerCase(),
        name: nameMatch ? nameMatch[1] : null,
        type: typeMatch ? typeMatch[1] : null
      });
    }
    forms.push({
      action: actionMatch ? actionMatch[1] : "",
      method: (methodMatch ? methodMatch[1] : "GET").toUpperCase(),
      controls: inputs.slice(0, 30)
    });
  }

  const headings = [];
  for (const m of html.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    headings.push({
      level: m[1].toLowerCase(),
      text: m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 120)
    });
  }

  const apiHints = Array.from(
    new Set(
      Array.from(html.matchAll(/(\/api\/[a-zA-Z0-9_./-]*|https?:\/\/[a-zA-Z0-9._:/-]+)/g)).map((x) => x[1])
    )
  ).slice(0, 40);

  return {
    title,
    byteLength: Buffer.byteLength(html, "utf8"),
    counts: {
      links: links.length,
      scripts: scripts.length,
      forms: forms.length,
      headings: headings.length,
      apiHints: apiHints.length
    },
    headings: headings.slice(0, 25),
    links: links.slice(0, 30),
    scripts: scripts.slice(0, 25),
    forms: forms.slice(0, 15),
    apiHints
  };
}

function analyzeJsSource(jsText, label = "inline-script") {
  const routes = Array.from(
    new Set(
      Array.from(jsText.matchAll(/["'`](\/[a-zA-Z0-9_./:-]{1,100})["'`]/g)).map((m) => m[1])
    )
  ).slice(0, 50);

  const endpoints = Array.from(
    new Set(
      Array.from(jsText.matchAll(/\b(?:fetch|axios\.[a-z]+|http\.request|WebSocket)\s*\(\s*["'`]([^"'`]+)["'`]/g)).map(
        (m) => m[1]
      )
    )
  ).slice(0, 40);

  const symbols = Array.from(
    new Set(
      Array.from(jsText.matchAll(/\b(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)|\bclass\s+([A-Za-z0-9_$]+)/g)).map(
        (m) => m[1] || m[2]
      )
    )
  ).slice(0, 40);

  const stateHooks = Array.from(
    new Set(
      Array.from(jsText.matchAll(/\b(useState|useEffect|useMemo|useCallback|useReducer|createStore|defineStore)\b/g)).map(
        (m) => m[1]
      )
    )
  );

  return {
    label,
    byteLength: Buffer.byteLength(jsText, "utf8"),
    lineCount: jsText.split("\n").length,
    routes,
    endpoints,
    symbols,
    stateHooks
  };
}

export async function investigateTarget(params = {}) {
  const focus = (params.focus || "Observable layout, navigation flow, routes, and interactive controls").trim();
  const targetUrl = (params.targetUrl || "").trim();
  const localPath = (params.localPath || "").trim();
  const maxScripts = Math.min(Number(params.maxScripts || 6), 15);
  const timeoutMs = Math.min(Number(params.timeoutMs || 8000), 20000);

  const evidence = [];
  const uncertainties = [];
  let htmlAnalysis = null;
  let scriptAnalyses = [];
  let localFileAnalysis = null;
  let responseMeta = null;

  if (localPath) {
    const resolved = path.resolve(localPath);
    if (!fs.existsSync(resolved)) {
      uncertainties.push(`Local path does not exist: ${resolved}`);
    } else {
      const stat = fs.statSync(resolved);
      if (stat.isDirectory()) {
        const entries = fs.readdirSync(resolved).slice(0, 60);
        localFileAnalysis = { kind: "directory", path: resolved, entries };
        evidence.push(`Inspected local directory ${resolved} with ${entries.length} top-level entries.`);
        uncertainties.push("Directory listing only inspects top-level filenames without executing code or reading nested binaries.");
      } else {
        const raw = fs.readFileSync(resolved, "utf8").slice(0, 200000);
        const ext = path.extname(resolved).toLowerCase();
        if (ext === ".html" || ext === ".htm") {
          htmlAnalysis = extractHtmlStructure(raw);
          evidence.push(`Parsed local HTML file ${resolved} (${htmlAnalysis.byteLength} bytes).`);
        } else if ([".js", ".mjs", ".cjs", ".ts", ".jsx", ".tsx"].includes(ext)) {
          localFileAnalysis = { kind: "script", ...analyzeJsSource(raw, path.basename(resolved)) };
          evidence.push(`Statically analyzed script ${resolved} (${localFileAnalysis.lineCount} lines).`);
        } else {
          localFileAnalysis = { kind: "text-or-data", path: resolved, bytes: stat.size, preview: raw.slice(0, 1200) };
          evidence.push(`Read local file ${resolved} (${stat.size} bytes).`);
        }
        uncertainties.push("Static inspection observes declared structure and symbols, not runtime network or state behavior.");
      }
    }
  }

  if (targetUrl) {
    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      throw new Error(`Invalid targetUrl: ${targetUrl}`);
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error(`Unsupported protocol ${parsedUrl.protocol}; only http and https are supported.`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(parsedUrl.toString(), {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "CareerOrchestrator-LocalInvestigator/1.0 (+local-research)",
          "Accept": "text/html,application/xhtml+xml,application/json,text/plain,*/*"
        }
      });
      clearTimeout(timer);

      const headersObj = {};
      for (const [k, v] of res.headers.entries()) {
        headersObj[k] = v;
      }
      const contentType = headersObj["content-type"] || "unknown";
      const bodyText = await res.text();

      responseMeta = {
        requestedUrl: parsedUrl.toString(),
        finalUrl: res.url,
        status: res.status,
        ok: res.ok,
        contentType,
        headers: headersObj,
        bodyBytes: Buffer.byteLength(bodyText, "utf8")
      };
      evidence.push(`Fetched ${res.url} -> HTTP ${res.status} (${contentType}, ${responseMeta.bodyBytes} bytes).`);

      if (contentType.includes("text/html") || bodyText.trim().startsWith("<!doctype") || bodyText.trim().startsWith("<html")) {
        htmlAnalysis = extractHtmlStructure(bodyText);
        evidence.push(
          `Extracted HTML structure: title="${htmlAnalysis.title}", links=${htmlAnalysis.counts.links}, scripts=${htmlAnalysis.counts.scripts}, forms=${htmlAnalysis.counts.forms}.`
        );

        const scriptSrcs = htmlAnalysis.scripts
          .map((s) => s.src)
          .filter(Boolean)
          .slice(0, maxScripts);

        for (const src of scriptSrcs) {
          let resolvedSrc;
          try {
            resolvedSrc = new URL(src, res.url).toString();
          } catch {
            uncertainties.push(`Could not resolve script URL: ${src}`);
            continue;
          }
          const scController = new AbortController();
          const scTimer = setTimeout(() => scController.abort(), Math.min(timeoutMs, 5000));
          try {
            const sRes = await fetch(resolvedSrc, {
              method: "GET",
              signal: scController.signal,
              headers: { "User-Agent": "CareerOrchestrator-LocalInvestigator/1.0" }
            });
            clearTimeout(scTimer);
            if (sRes.ok) {
              const sText = await sRes.text();
              scriptAnalyses.push(analyzeJsSource(sText.slice(0, 250000), resolvedSrc));
              evidence.push(`Fetched and analyzed script ${resolvedSrc} (${Buffer.byteLength(sText, "utf8")} bytes).`);
            } else {
              uncertainties.push(`Script ${resolvedSrc} returned HTTP ${sRes.status}.`);
            }
          } catch (sErr) {
            clearTimeout(scTimer);
            uncertainties.push(`Failed fetching script ${resolvedSrc}: ${sErr.message}`);
          }
        }
      } else if (contentType.includes("javascript") || parsedUrl.pathname.endsWith(".js")) {
        scriptAnalyses.push(analyzeJsSource(bodyText.slice(0, 250000), res.url));
        evidence.push(`Analyzed JavaScript response from ${res.url}.`);
      }

      uncertainties.push("Server-side backend logic, private authenticated routes, and dynamic client-side mutations after initial load are not directly observable from a single HTTP response.");
    } catch (err) {
      clearTimeout(timer);
      uncertainties.push(`HTTP fetch failed for ${parsedUrl.toString()}: ${err.message}`);
    }
  }

  if (!targetUrl && !localPath) {
    uncertainties.push("No targetUrl or localPath was supplied; only scope and focus metadata were recorded.");
  }

  return {
    focus,
    mode: "authorized-observable-inspection",
    targetUrl: targetUrl || null,
    localPath: localPath || null,
    responseMeta,
    htmlAnalysis,
    scriptAnalyses,
    localFileAnalysis,
    evidence,
    uncertainties,
    note: "Observable structure and static patterns only; does not claim original source code or proprietary backend internals."
  };
}
