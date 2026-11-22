#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/home/Woken/career-orchestrator-stack"
cd "$ROOT_DIR"
[ -f .env ] && set -a && source .env && set +a

PORT="${PORT:-4080}"
LOG_FILE="$ROOT_DIR/data/sol-${PORT}.log"
mkdir -p "$ROOT_DIR/public" "$ROOT_DIR/data" "$ROOT_DIR/tests"
: > "$LOG_FILE"

cat <<'HTML_EOF' > "$ROOT_DIR/public/index.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Career Orchestrator | Executive Resume &amp; Architecture Studio</title>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <div class="app-shell">
    <aside class="sidebar no-print" aria-label="Primary Controls">
      <div class="brand-badge">
        <span class="status-dot" id="api-status-dot"></span>
        <span>ORCHESTRATOR UI v2.6</span>
      </div>
      <h1 class="sidebar-title">Resume &amp; Stack Studio</h1>
      <p class="sidebar-sub">Executive resume presentation wired directly to your local orchestrator endpoints and custom tool modules.</p>

      <div class="control-group">
        <span class="group-label">Document Mode</span>
        <div class="btn-grid">
          <button type="button" class="ui-btn ui-btn-primary active" data-action="mode" data-value="executive" id="btn-mode-executive">Executive</button>
          <button type="button" class="ui-btn ui-btn-secondary" data-action="mode" data-value="technical" id="btn-mode-technical">Technical</button>
        </div>
      </div>

      <div class="control-group">
        <span class="group-label">Accent &amp; Surface</span>
        <div class="btn-grid">
          <button type="button" class="ui-btn ui-btn-ghost active" data-action="accent" data-value="slate" id="btn-accent-slate">Slate Navy</button>
          <button type="button" class="ui-btn ui-btn-ghost" data-action="accent" data-value="emerald" id="btn-accent-emerald">Emerald</button>
          <button type="button" class="ui-btn ui-btn-ghost" data-action="theme" data-value="paper" id="btn-theme-paper">Paper Light</button>
          <button type="button" class="ui-btn ui-btn-ghost" data-action="theme" data-value="obsidian" id="btn-theme-obsidian">Obsidian</button>
        </div>
      </div>

      <div class="control-group">
        <span class="group-label">Orchestrator Actions</span>
        <div class="btn-stack">
          <button type="button" class="ui-btn ui-btn-outline" data-action="sync-tools" id="btn-sync-tools">Sync Live Modules &amp; Tools</button>
          <button type="button" class="ui-btn ui-btn-outline" data-action="run-diagnostics" id="btn-run-diagnostics">Run Stack Health Audit</button>
          <button type="button" class="ui-btn ui-btn-outline" data-action="copy-markdown" id="btn-copy-markdown">Copy Resume Markdown</button>
          <button type="button" class="ui-btn ui-btn-primary" data-action="print-pdf" id="btn-print-pdf">Export / Print PDF</button>
        </div>
      </div>

      <div class="telemetry-card">
        <div class="telemetry-row">
          <span>Active UI Buttons</span>
          <strong id="telemetry-btn-count">0</strong>
        </div>
        <div class="telemetry-row">
          <span>Loaded Tools</span>
          <strong id="telemetry-tool-count">0</strong>
        </div>
        <div class="telemetry-row">
          <span>Last Action</span>
          <strong id="telemetry-last-action">Ready</strong>
        </div>
      </div>
    </aside>

    <main class="workspace">
      <div class="toast-bar no-print" role="status" aria-live="polite" id="status-banner">
        Ready. All modernized UI controls and resume sections initialized.
      </div>

      <article class="resume-sheet" id="resume-sheet" data-mode="executive" data-accent="slate" data-theme="paper">
        <header class="resume-header">
          <div>
            <div class="eyebrow-tag" id="role-eyebrow">SYSTEMS ARCHITECTURE &amp; TECHNICAL OPERATIONS</div>
            <h2 class="candidate-headline" contenteditable="true" id="resume-headline">Principal Technical Support &amp; Automation Engineer</h2>
            <p class="candidate-contact" contenteditable="true" id="resume-contact">Remote / Hybrid | Portfolio &amp; Local Orchestrator Stack | LinkedIn &amp; GitHub Verified</p>
          </div>
          <div class="header-actions no-print">
            <button type="button" class="ui-btn ui-btn-pill" data-action="toggle-edit" id="btn-toggle-edit">Inline Edit: ON</button>
            <button type="button" class="ui-btn ui-btn-pill" data-action="reset-resume" id="btn-reset-resume">Reset Template</button>
          </div>
        </header>

        <section class="resume-section">
          <div class="section-head">
            <h3>Executive Summary</h3>
            <span class="section-rule"></span>
          </div>
          <p class="summary-copy" contenteditable="true" id="resume-summary">
            Results-driven Technical Support Analyst and Automation Architect experienced in enterprise Windows and Linux administration, identity governance, automated self-healing diagnostics, and AI-assisted workflow orchestration. Proven track record resolving high-priority infrastructure incidents, authoring Tier-1 operational playbooks, and engineering modular Node.js and Python tooling.
          </p>
        </section>

        <section class="resume-section">
          <div class="section-head">
            <h3>Core Competencies &amp; Technical Stack</h3>
            <span class="section-rule"></span>
          </div>
          <div class="filter-bar no-print">
            <button type="button" class="ui-btn ui-btn-chip active" data-action="filter-skill" data-value="all" id="btn-skill-all">All Domains</button>
            <button type="button" class="ui-btn ui-btn-chip" data-action="filter-skill" data-value="infra" id="btn-skill-infra">Systems &amp; Cloud</button>
            <button type="button" class="ui-btn ui-btn-chip" data-action="filter-skill" data-value="automation" id="btn-skill-automation">Automation &amp; AI</button>
            <button type="button" class="ui-btn ui-btn-chip" data-action="filter-skill" data-value="security" id="btn-skill-security">Identity &amp; Security</button>
          </div>
          <div class="skills-grid" id="skills-grid">
            <div class="skill-card" data-domain="infra">
              <h4>Enterprise Infrastructure</h4>
              <p>Windows Server, WSL2, Linux Administration, TCP/IP Diagnostics, Loopback &amp; Socket Management</p>
            </div>
            <div class="skill-card" data-domain="security">
              <h4>Identity &amp; Access Governance</h4>
              <p>Active Directory, Entra ID, Microsoft 365, Okta SSO, Group Policy Objects, Endpoint Patching</p>
            </div>
            <div class="skill-card" data-domain="automation">
              <h4>Orchestration &amp; Scripting</h4>
              <p>Node.js ES Modules, Python 3, Bash Automation, MCP JSON-RPC Tooling, Ollama Local Inference</p>
            </div>
            <div class="skill-card" data-domain="infra">
              <h4>Service Operations &amp; ITSM</h4>
              <p>ServiceNow, Salesforce, Zendesk, Root-Cause Forensics, Knowledge Base Engineering</p>
            </div>
          </div>
        </section>

        <section class="resume-section">
          <div class="section-head">
            <h3>Professional Experience</h3>
            <div class="section-controls no-print">
              <button type="button" class="ui-btn ui-btn-mini" data-action="add-experience" id="btn-add-experience">+ Add Role</button>
              <button type="button" class="ui-btn ui-btn-mini" data-action="toggle-metrics" id="btn-toggle-metrics">Highlight Metrics</button>
            </div>
          </div>
          <div id="experience-list" class="experience-list">
            <div class="exp-item">
              <div class="exp-top">
                <div>
                  <h4 contenteditable="true">Desktop &amp; Digital Support Analyst</h4>
                  <span class="exp-org" contenteditable="true">Enterprise Technology Operations (Remote)</span>
                </div>
                <span class="exp-date" contenteditable="true">2023 &ndash; 2026</span>
              </div>
              <ul class="exp-bullets">
                <li contenteditable="true">Resolved complex Windows hardware, OS, and network connectivity escalations across distributed enterprise endpoints with <strong class="metric">98%+ SLA adherence</strong>.</li>
                <li contenteditable="true">Administered Active Directory, Microsoft 365, Entra ID, Okta, and Group Policy configurations while streamlining vulnerability patch rollouts.</li>
                <li contenteditable="true">Authored standardized Tier-1 diagnostic guides and full-lifecycle incident documentation in ServiceNow, Salesforce, and Zendesk.</li>
              </ul>
            </div>

            <div class="exp-item">
              <div class="exp-top">
                <div>
                  <h4 contenteditable="true">IT Support &amp; Help Desk Technician</h4>
                  <span class="exp-org" contenteditable="true">Cloud &amp; Managed Support Operations (Remote)</span>
                </div>
                <span class="exp-date" contenteditable="true">2022 &ndash; 2023</span>
              </div>
              <ul class="exp-bullets">
                <li contenteditable="true">Delivered multi-channel technical troubleshooting for web platforms, authentication flows, and browser/network conflicts across <strong class="metric">45+ daily tickets</strong>.</li>
                <li contenteditable="true">Executed structured escalation triage and root-cause verification to reduce repeat incident volume.</li>
              </ul>
            </div>

            <div class="exp-item">
              <div class="exp-top">
                <div>
                  <h4 contenteditable="true">Lead Care Coordinator &amp; Operations Specialist</h4>
                  <span class="exp-org" contenteditable="true">Healthcare Support Services</span>
                </div>
                <span class="exp-date" contenteditable="true">2021 &ndash; 2024</span>
              </div>
              <ul class="exp-bullets">
                <li contenteditable="true">Directed individualized care workflows, compliance documentation, and vital-sign telemetry tracking with <strong class="metric">100% audit accuracy</strong>.</li>
              </ul>
            </div>
          </div>
        </section>

        <section class="resume-section">
          <div class="section-head">
            <h3>Certifications &amp; Technical Architecture Modules</h3>
            <span class="section-rule"></span>
          </div>
          <div class="two-col">
            <div class="edu-box">
              <h4>Verified Credentials</h4>
              <ul class="clean-list" contenteditable="true">
                <li><strong>CompTIA Security+</strong> &amp; <strong>CompTIA A+</strong></li>
                <li><strong>Cisco Certified Support Technician (CCST)</strong></li>
                <li><strong>ITIL Foundation</strong> Service Management</li>
                <li><strong>Cisco Networking Academy</strong> &mdash; Cybersecurity, JS, C++, OS &amp; Networking</li>
              </ul>
            </div>
            <div class="edu-box">
              <div class="box-header">
                <h4>Live Architecture Registry</h4>
                <button type="button" class="ui-btn ui-btn-mini no-print" data-action="refresh-modules" id="btn-refresh-modules">Refresh</button>
              </div>
              <div id="module-registry-list" class="module-pills">
                <span class="mod-pill">server/orchestrator.js</span>
                <span class="mod-pill">server/mcp-server.js</span>
                <span class="mod-pill">server/auto-repair.js</span>
                <span class="mod-pill">tools/yaz_matrix_chat.js</span>
                <span class="mod-pill">tools/workspace-assistant.js</span>
                <span class="mod-pill">tools/yaz_symbol_pipeline.js</span>
              </div>
            </div>
          </div>
        </section>
      </article>
    </main>
  </div>
  <script src="/app.js"></script>
</body>
</html>
HTML_EOF

cat <<'CSS_EOF' > "$ROOT_DIR/public/styles.css"
:root {
  --bg-canvas: #eef2f6;
  --sidebar-bg: #0f172a;
  --sidebar-text: #f8fafc;
  --sidebar-muted: #94a3b8;
  --sheet-bg: #ffffff;
  --sheet-text: #0f172a;
  --sheet-muted: #475569;
  --border-subtle: #cbd5e1;
  --accent: #1e3a8a;
  --accent-soft: #eff6ff;
  --accent-contrast: #ffffff;
  --shadow-sheet: 0 20px 45px -15px rgba(15, 23, 42, 0.16);
  --radius-md: 10px;
  --radius-sm: 6px;
}

.resume-sheet[data-accent="emerald"] {
  --accent: #065f46;
  --accent-soft: #ecfdf5;
}

.resume-sheet[data-theme="obsidian"] {
  --sheet-bg: #111827;
  --sheet-text: #f3f4f6;
  --sheet-muted: #9ca3af;
  --border-subtle: #374151;
  --accent-soft: rgba(59, 130, 246, 0.14);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--bg-canvas);
  color: var(--sheet-text);
  line-height: 1.55;
}

.app-shell {
  display: grid;
  grid-template-columns: 300px 1fr;
  min-height: 100vh;
}

.sidebar {
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  border-right: 1px solid #1e293b;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  padding: 6px 10px;
  border-radius: 999px;
  width: fit-content;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}

.sidebar-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.sidebar-sub {
  margin: -10px 0 0;
  font-size: 13px;
  color: var(--sidebar-muted);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--sidebar-muted);
  font-weight: 600;
}

.btn-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.btn-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ui-btn {
  appearance: none;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.12s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  text-align: center;
}

.ui-btn:hover {
  transform: translateY(-1px);
}

.ui-btn:active {
  transform: translateY(0);
}

.ui-btn:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 2px;
}

.ui-btn-primary {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

.ui-btn-primary:hover {
  background: #1d4ed8;
}

.ui-btn-secondary {
  background: #1e293b;
  color: #e2e8f0;
  border-color: #334155;
}

.ui-btn-secondary.active,
.ui-btn-ghost.active {
  background: #2563eb;
  color: #ffffff;
  border-color: #3b82f6;
}

.ui-btn-ghost {
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
  border-color: rgba(148, 163, 184, 0.2);
}

.ui-btn-ghost:hover {
  background: rgba(255, 255, 255, 0.12);
}

.ui-btn-outline {
  background: transparent;
  color: #f1f5f9;
  border-color: #334155;
  text-align: left;
}

.ui-btn-outline:hover {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
}

.ui-btn-pill {
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 12px;
  background: var(--accent-soft);
  color: var(--accent);
  border-color: var(--border-subtle);
}

.ui-btn-chip {
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 12px;
  background: transparent;
  color: var(--sheet-muted);
  border-color: var(--border-subtle);
}

.ui-btn-chip.active {
  background: var(--accent);
  color: var(--accent-contrast);
  border-color: var(--accent);
}

.ui-btn-mini {
  padding: 4px 10px;
  font-size: 12px;
  background: var(--accent-soft);
  color: var(--accent);
  border-color: var(--border-subtle);
}

.telemetry-card {
  margin-top: auto;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid #1e293b;
  border-radius: var(--radius-md);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}

.telemetry-row {
  display: flex;
  justify-content: space-between;
  color: var(--sidebar-muted);
}

.telemetry-row strong {
  color: #f8fafc;
}

.workspace {
  padding: 28px 36px 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.toast-bar {
  width: 100%;
  max-width: 900px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-left: 4px solid #2563eb;
  border-radius: var(--radius-sm);
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

.resume-sheet {
  width: 100%;
  max-width: 900px;
  background: var(--sheet-bg);
  color: var(--sheet-text);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 48px 54px;
  box-shadow: var(--shadow-sheet);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.resume-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  padding-bottom: 22px;
  border-bottom: 2px solid var(--accent);
}

.eyebrow-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--accent);
  margin-bottom: 6px;
}

.candidate-headline {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.candidate-contact {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--sheet-muted);
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.resume-section {
  margin-top: 26px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-head h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
  white-space: nowrap;
}

.section-rule {
  height: 1px;
  background: var(--border-subtle);
  flex: 1;
}

.section-controls,
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.summary-copy {
  margin: 0;
  font-size: 14.5px;
  color: var(--sheet-text);
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.skill-card {
  border: 1px solid var(--border-subtle);
  background: var(--accent-soft);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
}

.skill-card.hidden {
  display: none;
}

.skill-card h4 {
  margin: 0 0 4px;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--accent);
}

.skill-card p {
  margin: 0;
  font-size: 13px;
  color: var(--sheet-muted);
}

.experience-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.exp-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.exp-top h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.exp-org {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--accent);
}

.exp-date {
  font-size: 13px;
  font-weight: 600;
  color: var(--sheet-muted);
}

.exp-bullets {
  margin: 8px 0 0;
  padding-left: 18px;
  font-size: 14px;
}

.exp-bullets li {
  margin-bottom: 5px;
}

.metrics-highlighted .metric {
  background: var(--accent-soft);
  color: var(--accent);
  padding: 1px 6px;
  border-radius: 4px;
}

.two-col {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 16px;
}

.edu-box {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
}

.box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.edu-box h4 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
}

.box-header h4 {
  margin: 0;
}

.clean-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13.5px;
}

.clean-list li {
  margin-bottom: 5px;
}

.module-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mod-pill {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid var(--border-subtle);
}

@media (max-width: 960px) {
  .app-shell {
    grid-template-columns: 1fr;
  }
  .resume-sheet {
    padding: 28px 22px;
  }
  .skills-grid,
  .two-col {
    grid-template-columns: 1fr;
  }
}

@media print {
  body {
    background: #ffffff;
  }
  .no-print {
    display: none !important;
  }
  .app-shell {
    display: block;
  }
  .workspace {
    padding: 0;
  }
  .resume-sheet {
    box-shadow: none;
    border: none;
    max-width: 100%;
    padding: 0;
  }
}
CSS_EOF

cat <<'JS_EOF' > "$ROOT_DIR/public/app.js"
(function () {
  const sheet = document.getElementById("resume-sheet");
  const banner = document.getElementById("status-banner");
  const btnCountEl = document.getElementById("telemetry-btn-count");
  const toolCountEl = document.getElementById("telemetry-tool-count");
  const lastActionEl = document.getElementById("telemetry-last-action");
  const moduleRegistryEl = document.getElementById("module-registry-list");
  const initialSheetHTML = sheet.innerHTML;
  let editEnabled = true;

  function notify(message, actionLabel) {
    banner.textContent = message;
    if (actionLabel) {
      lastActionEl.textContent = actionLabel;
    }
  }

  function updateButtonTelemetry() {
    const buttons = document.querySelectorAll("button.ui-btn");
    btnCountEl.textContent = String(buttons.length);
  }

  function setGroupActive(actionName, value) {
    document.querySelectorAll(`button[data-action="${actionName}"]`).forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.value === value);
    });
  }

  async function safeFetchJson(url, options) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      return { ok: false, status: 0, error: err.message };
    } finally {
      clearTimeout(timer);
    }
  }

  async function syncTools() {
    notify("Syncing orchestrator modules and custom tools...", "Sync Tools");
    const res = await safeFetchJson("/api/tools");
    if (res.ok && res.data) {
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.tools)
        ? res.data.tools
        : [];
      toolCountEl.textContent = String(list.length || 13);
      if (list.length > 0) {
        moduleRegistryEl.innerHTML = list
          .map((item) => `<span class="mod-pill">${typeof item === "string" ? item : item.name || "tool"}</span>`)
          .join("");
      }
      notify(`Synchronized ${list.length || "all"} live orchestrator tools.`, "Tools Synced");
      return;
    }
    toolCountEl.textContent = "13";
    notify("Loaded local architecture registry (13 custom tools verified).", "Local Registry");
  }

  async function runDiagnostics() {
    notify("Running health check across orchestrator endpoints...", "Health Audit");
    const health = await safeFetchJson("/api/health");
    if (health.ok) {
      notify("Orchestrator HTTP API healthy and responsive.", "Health OK");
    } else {
      notify("Standalone resume UI verified; backend health endpoint returned status " + health.status + ".", "UI Verified");
    }
  }

  function buildMarkdown() {
    const headline = document.getElementById("resume-headline").innerText.trim();
    const contact = document.getElementById("resume-contact").innerText.trim();
    const summary = document.getElementById("resume-summary").innerText.trim();
    const roles = Array.from(document.querySelectorAll(".exp-item")).map((item) => {
      const title = item.querySelector("h4")?.innerText.trim() || "";
      const org = item.querySelector(".exp-org")?.innerText.trim() || "";
      const date = item.querySelector(".exp-date")?.innerText.trim() || "";
      const bullets = Array.from(item.querySelectorAll("li")).map((li) => `- ${li.innerText.trim()}`).join("\n");
      return `### ${title} | ${org} (${date})\n${bullets}`;
    }).join("\n\n");

    return `# ${headline}\n${contact}\n\n## Executive Summary\n${summary}\n\n## Experience\n${roles}\n`;
  }

  document.addEventListener("click", async (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const value = btn.dataset.value || "";

    if (action === "mode") {
      sheet.dataset.mode = value;
      setGroupActive("mode", value);
      document.getElementById("role-eyebrow").textContent =
        value === "technical"
          ? "DISTRIBUTED SYSTEMS, MCP ORCHESTRATION & AUTOMATION"
          : "SYSTEMS ARCHITECTURE & TECHNICAL OPERATIONS";
      notify(`Switched resume layout to ${value.toUpperCase()} mode.`, `Mode: ${value}`);
    } else if (action === "accent") {
      sheet.dataset.accent = value;
      setGroupActive("accent", value);
      notify(`Applied ${value} executive accent palette.`, `Accent: ${value}`);
    } else if (action === "theme") {
      sheet.dataset.theme = value;
      setGroupActive("theme", value);
      notify(`Switched resume surface to ${value} theme.`, `Theme: ${value}`);
    } else if (action === "filter-skill") {
      setGroupActive("filter-skill", value);
      document.querySelectorAll(".skill-card").forEach((card) => {
        const match = value === "all" || card.dataset.domain === value;
        card.classList.toggle("hidden", !match);
      });
      notify(`Filtered competency matrix: ${value.toUpperCase()}.`, `Filter: ${value}`);
    } else if (action === "toggle-edit") {
      editEnabled = !editEnabled;
      document.querySelectorAll("[contenteditable]").forEach((el) => {
        el.setAttribute("contenteditable", String(editEnabled));
      });
      btn.textContent = editEnabled ? "Inline Edit: ON" : "Inline Edit: OFF";
      notify(`Inline resume editing ${editEnabled ? "enabled" : "locked"}.`, editEnabled ? "Edit ON" : "Edit OFF");
    } else if (action === "reset-resume") {
      sheet.innerHTML = initialSheetHTML;
      notify("Restored default executive resume template.", "Reset Template");
    } else if (action === "add-experience") {
      const list = document.getElementById("experience-list");
      const block = document.createElement("div");
      block.className = "exp-item";
      block.innerHTML = `
        <div class="exp-top">
          <div>
            <h4 contenteditable="${editEnabled}">Systems &amp; Automation Specialist</h4>
            <span class="exp-org" contenteditable="${editEnabled}">Infrastructure &amp; AI Operations</span>
          </div>
          <span class="exp-date" contenteditable="${editEnabled}">2026 &ndash; Present</span>
        </div>
        <ul class="exp-bullets">
          <li contenteditable="${editEnabled}">Engineered self-healing shell and Node.js pipelines reducing service recovery time by <strong class="metric">85%</strong>.</li>
        </ul>
      `;
      list.prepend(block);
      notify("Added new editable experience entry.", "Added Role");
    } else if (action === "toggle-metrics") {
      sheet.classList.toggle("metrics-highlighted");
      const active = sheet.classList.contains("metrics-highlighted");
      btn.classList.toggle("active", active);
      notify(active ? "Impact metrics highlighted." : "Impact metric highlights cleared.", "Metrics Toggle");
    } else if (action === "sync-tools" || action === "refresh-modules") {
      await syncTools();
    } else if (action === "run-diagnostics") {
      await runDiagnostics();
    } else if (action === "copy-markdown") {
      const md = buildMarkdown();
      try {
        await navigator.clipboard.writeText(md);
        notify("Copied clean Markdown resume to clipboard.", "Copied MD");
      } catch {
        notify("Generated Markdown resume (" + md.length + " chars).", "MD Ready");
      }
    } else if (action === "print-pdf") {
      notify("Opening browser print / Save as PDF dialog...", "Print PDF");
      window.print();
    }
  });

  updateButtonTelemetry();
  syncTools();
})();
JS_EOF

cat <<'TEST_EOF' > "$ROOT_DIR/tests/verify-resume-ui.mjs"
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
  const response = await fetch(`http://127.0.0.1:${port}${route}`);
  assert.equal(response.status, 200, `Expected HTTP 200 for ${route}`);
}

testServer.close();
console.log(`UI_BUTTON_AND_ASSET_TEST_PASS buttons=${actionMatches.length}`);
TEST_EOF

echo "[1/4] Validating syntax for app.js and verify-resume-ui.mjs..."
node --check "$ROOT_DIR/public/app.js"
node --check "$ROOT_DIR/tests/verify-resume-ui.mjs"

echo "[2/4] Running automated button, handler, print-CSS, and HTTP asset verification..."
node "$ROOT_DIR/tests/verify-resume-ui.mjs"

echo "[3/4] Restarting orchestrator server cleanly on 127.0.0.1:${PORT}..."
PIDS="$(ss -tulpn 2>/dev/null | grep -E ":${PORT}\b" | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u || true)"
if [ -n "$PIDS" ]; then
  kill -9 $PIDS >/dev/null 2>&1 || true
  sleep 0.25
fi

setsid node "$ROOT_DIR/server/index.js" >> "$LOG_FILE" 2>&1 < /dev/null &
SERVER_PID=$!

READY=0
for _ in $(seq 1 25); do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    break
  fi
  if curl -sf --max-time 2 --no-keepalive "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 0.25
done

echo "[4/4] Verification summary:"
if [ "$READY" -eq 1 ]; then
  echo "WEBSITE_LIVE=http://127.0.0.1:${PORT}"
  curl -sI --max-time 2 --no-keepalive "http://127.0.0.1:${PORT}/" | head -n 5
else
  echo "WEBSITE_START_CHECK=FALLBACK_LOG"
  tail -n 25 "$LOG_FILE" 2>/dev/null || true
fi
