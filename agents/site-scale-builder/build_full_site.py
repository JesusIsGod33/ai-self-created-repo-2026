import argparse
import html
import json
from pathlib import Path


def slugify(label: str) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() or ch in (" ", "-") else "" for ch in label)
    return "-".join(cleaned.split()) or "section"


def build_site(out_dir: Path, brand: str, tagline: str, sections: list[str]) -> list[str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    esc_brand = html.escape(brand)
    esc_tagline = html.escape(tagline)

    nav_items = "\n".join(
        f'        <a href="#{slugify(sec)}" class="nav-pill">{html.escape(sec)}</a>'
        for sec in sections
    )

    section_cards = "\n".join(
        f"""      <article id="{slugify(sec)}" class="card" data-section-name="{html.escape(sec)}" data-index="{idx + 1}">
        <div class="card-top">
          <span class="step-badge">0{idx + 1}</span>
          <span class="status-tag">Active Module</span>
        </div>
        <h2>{html.escape(sec)}</h2>
        <p class="card-copy">Interactive workspace for {html.escape(sec)} inside {esc_brand}. Open the inspector to run actions, copy a direct section link, or toggle completion.</p>
        <div class="card-actions">
          <button type="button" class="btn btn-primary inspect-btn" data-section="{html.escape(sec)}">Open {html.escape(sec)}</button>
          <button type="button" class="btn btn-subtle pin-btn" data-section="{html.escape(sec)}">Pin Card</button>
        </div>
      </article>"""
        for idx, sec in enumerate(sections)
    )

    html_content = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{esc_brand}</title>
  <link rel="stylesheet" href="./styles.css" />
</head>
<body>
  <div class="bg-glow" aria-hidden="true"></div>

  <header class="topbar">
    <div class="container topbar-inner">
      <a href="#top" class="brand">{esc_brand}</a>
      <nav class="nav-strip" aria-label="Page sections">
{nav_items}
      </nav>
    </div>
  </header>

  <main id="top" class="container page-main">
    <section class="hero-card">
      <div class="hero-meta">
        <span class="pill-badge">Single-Page Full Site</span>
        <span id="active-count" class="muted-meta">{len(sections)} Sections Ready</span>
      </div>
      <h1>{esc_brand}</h1>
      <p class="hero-subtitle">{esc_tagline}</p>
      <div class="toolbar">
        <input id="section-search" type="search" class="search-input" placeholder="Filter sections by name..." aria-label="Filter sections" />
        <button type="button" id="btn-highlight-all" class="btn btn-primary">Highlight All</button>
        <button type="button" id="btn-clear-all" class="btn btn-subtle">Clear States</button>
      </div>
    </section>

    <section class="workspace-layout">
      <div id="cards-grid" class="cards-grid">
{section_cards}
      </div>

      <aside id="inspector-drawer" class="inspector-card" aria-live="polite">
        <div class="inspector-header">
          <span class="pill-badge">Section Inspector</span>
          <button type="button" id="btn-close-inspector" class="btn btn-ghost">Close</button>
        </div>
        <h2 id="inspector-title">Select a section to inspect</h2>
        <p id="inspector-body" class="inspector-copy">Click any "Open" button on a card to load interactive controls, run a simulated workflow step, or copy its anchor link.</p>
        <div class="inspector-actions">
          <button type="button" id="btn-run-step" class="btn btn-primary" disabled>Run Section Action</button>
          <button type="button" id="btn-copy-link" class="btn btn-subtle" disabled>Copy Anchor Link</button>
        </div>
        <div class="log-box">
          <div class="log-header">
            <span>Activity Log</span>
            <button type="button" id="btn-clear-log" class="link-btn">Clear</button>
          </div>
          <ul id="activity-log" class="activity-list">
            <li>Initialized {esc_brand} with {len(sections)} sections.</li>
          </ul>
        </div>
      </aside>
    </section>
  </main>

  <script type="module" src="./app.js"></script>
</body>
</html>
"""

    css_content = """:root {
  --bg: #070b14;
  --surface: rgba(15, 23, 42, 0.88);
  --surface-elevated: rgba(23, 35, 62, 0.95);
  --border: rgba(148, 163, 184, 0.18);
  --border-accent: #38bdf8;
  --text: #f1f5f9;
  --muted: #94a3b8;
  --accent: #38bdf8;
  --accent-ink: #04101c;
  --accent-2: #34d399;
}

*, *::before, *::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.55;
  overflow-x: hidden;
}

.bg-glow {
  position: fixed;
  inset: -20% auto auto 50%;
  transform: translateX(-50%);
  width: 960px;
  height: 460px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.16), rgba(52, 211, 153, 0.06) 45%, transparent 72%);
  pointer-events: none;
  z-index: 0;
}

.container {
  position: relative;
  z-index: 1;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1.25rem;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(7, 11, 20, 0.84);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border);
}

.topbar-inner {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.brand {
  color: var(--text);
  text-decoration: none;
  font-weight: 800;
  font-size: 1.05rem;
  letter-spacing: -0.01em;
}

.nav-strip {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.nav-pill {
  color: var(--muted);
  text-decoration: none;
  font-size: 0.84rem;
  font-weight: 600;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  border: 1px solid transparent;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.nav-pill:hover {
  color: var(--text);
  background: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.35);
}

.page-main {
  padding: 2rem 0 3.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.hero-card {
  background: linear-gradient(145deg, rgba(17, 26, 46, 0.94), rgba(11, 18, 34, 0.94));
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 1.75rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
}

.hero-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
  flex-wrap: wrap;
}

.pill-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--accent);
  background: rgba(56, 189, 248, 0.14);
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.muted-meta {
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 600;
}

.hero-card h1 {
  margin: 0;
  font-size: clamp(1.75rem, 3.2vw, 2.5rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  margin: 0.6rem 0 1.25rem;
  color: var(--muted);
  font-size: 1rem;
  max-width: 72ch;
}

.toolbar {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  flex: 1 1 240px;
  min-width: 200px;
  padding: 0.62rem 0.85rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(7, 11, 20, 0.8);
  color: var(--text);
  font-size: 0.9rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
}

.workspace-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, 1fr);
  gap: 1.25rem;
  align-items: start;
}

@media (max-width: 920px) {
  .workspace-layout {
    grid-template-columns: 1fr;
  }
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}

.card:hover {
  transform: translateY(-2px);
  border-color: rgba(148, 163, 184, 0.36);
}

.card.is-highlighted {
  border-color: var(--border-accent);
  box-shadow: 0 0 0 1px var(--border-accent), 0 12px 28px rgba(56, 189, 248, 0.14);
}

.card.is-pinned {
  border-color: var(--accent-2);
  background: linear-gradient(160deg, rgba(16, 185, 129, 0.1), var(--surface-elevated));
}

.card.is-hidden {
  display: none;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.step-badge {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.status-tag {
  font-size: 0.74rem;
  color: var(--muted);
  background: rgba(148, 163, 184, 0.1);
  padding: 0.16rem 0.55rem;
  border-radius: 999px;
}

.card h2 {
  margin: 0;
  font-size: 1.12rem;
  letter-spacing: -0.01em;
}

.card-copy {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
  flex: 1 1 auto;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-top: 0.25rem;
}

.inspector-card {
  position: sticky;
  top: 84px;
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.inspector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.inspector-card h2 {
  margin: 0;
  font-size: 1.2rem;
}

.inspector-copy {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.inspector-actions {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.log-box {
  background: rgba(7, 11, 20, 0.78);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.8rem;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
  margin-bottom: 0.5rem;
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.activity-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 220px;
  overflow-y: auto;
  font-size: 0.82rem;
  color: var(--text);
}

.activity-list li {
  padding: 0.4rem 0.55rem;
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.55);
}

.btn {
  border-radius: 10px;
  padding: 0.55rem 0.9rem;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--accent);
  color: var(--accent-ink);
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(1.08);
}

.btn-subtle {
  background: rgba(30, 41, 59, 0.85);
  color: var(--text);
  border-color: var(--border);
}

.btn-subtle:hover:not(:disabled) {
  border-color: rgba(148, 163, 184, 0.45);
}

.btn-ghost {
  background: transparent;
  color: var(--muted);
  border-color: var(--border);
  padding: 0.35rem 0.65rem;
  font-size: 0.78rem;
}

.btn-ghost:hover:not(:disabled) {
  color: var(--text);
}
"""

    js_content = """const cards = [...document.querySelectorAll(".card[data-section-name]")];
const searchInput = document.getElementById("section-search");
const activeCount = document.getElementById("active-count");
const inspectorTitle = document.getElementById("inspector-title");
const inspectorBody = document.getElementById("inspector-body");
const runStepBtn = document.getElementById("btn-run-step");
const copyLinkBtn = document.getElementById("btn-copy-link");
const activityLog = document.getElementById("activity-log");

let selectedCard = null;

function pushLog(message) {
  if (!activityLog) return;
  const item = document.createElement("li");
  const stamp = new Date().toLocaleTimeString([], { hour12: false });
  item.textContent = `[${stamp}] ${message}`;
  activityLog.prepend(item);
}

function updateVisibleCount() {
  const visible = cards.filter((c) => !c.classList.contains("is-hidden")).length;
  if (activeCount) {
    activeCount.textContent = `${visible} of ${cards.length} Sections Visible`;
  }
}

function selectSection(card) {
  selectedCard = card;
  const name = card.dataset.sectionName || "Section";
  const idx = card.dataset.index || "1";
  cards.forEach((c) => c.classList.add("is-highlighted"));
  if (inspectorTitle) inspectorTitle.textContent = `${name} (Module #${idx})`;
  if (inspectorBody) {
    inspectorBody.textContent = `Section "${name}" is active. Trigger "Run Section Action" to log a workflow run or "Copy Anchor Link" to grab #${card.id}.`;
  }
  if (runStepBtn) runStepBtn.disabled = false;
  if (copyLinkBtn) copyLinkBtn.disabled = false;
  pushLog(`Opened inspector for ${name}`);
}

document.querySelectorAll(".inspect-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".card");
    if (card) selectSection(card);
  });
});

document.querySelectorAll(".pin-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".card");
    if (!card) return;
    const pinned = card.classList.toggle("is-pinned");
    const statusTag = card.querySelector(".status-tag");
    if (statusTag) statusTag.textContent = pinned ? "Pinned" : "Active Module";
    btn.textContent = pinned ? "Unpin" : "Pin Card";
    pushLog(`${pinned ? "Pinned" : "Unpinned"} ${card.dataset.sectionName}`);
  });
});

runStepBtn?.addEventListener("click", () => {
  if (!selectedCard) return;
  const name = selectedCard.dataset.sectionName || "Section";
  selectedCard.classList.add("is-highlighted");
  pushLog(`Executed action on [${name}]`);
});

copyLinkBtn?.addEventListener("click", async () => {
  if (!selectedCard) return;
  const hash = `#${selectedCard.id}`;
  const url = `${window.location.origin}${window.location.pathname}${hash}`;
  window.location.hash = hash;
  try {
    await navigator.clipboard.writeText(url);
    pushLog(`Copied anchor link: ${url}`);
  } catch {
    pushLog(`Set anchor hash: ${hash}`);
  }
});

document.getElementById("btn-highlight-all")?.addEventListener("click", () => {
  cards.forEach((c) => c.classList.add("is-highlighted"));
  pushLog(`Highlighted all ${cards.length} sections`);
});

document.getElementById("btn-clear-all")?.addEventListener("click", () => {
  cards.forEach((c) => {
    c.classList.remove("is-highlighted", "is-pinned");
    const statusTag = c.querySelector(".status-tag");
    const pinBtn = c.querySelector(".pin-btn");
    if (statusTag) statusTag.textContent = "Active Module";
    if (pinBtn) pinBtn.textContent = "Pin Card";
  });
  if (searchInput) searchInput.value = "";
  cards.forEach((c) => c.classList.remove("is-hidden"));
  updateVisibleCount();
  pushLog("Cleared highlights, pins, and search filter");
});

document.getElementById("btn-close-inspector")?.addEventListener("click", () => {
  selectedCard = null;
  if (inspectorTitle) inspectorTitle.textContent = "Select a section to inspect";
  if (inspectorBody) {
    inspectorBody.textContent = 'Click any "Open" button on a card to load interactive controls, run a simulated workflow step, or copy its anchor link.';
  }
  if (runStepBtn) runStepBtn.disabled = true;
  if (copyLinkBtn) copyLinkBtn.disabled = true;
  pushLog("Closed section inspector");
});

document.getElementById("btn-clear-log")?.addEventListener("click", () => {
  if (activityLog) activityLog.innerHTML = "";
});

searchInput?.addEventListener("input", (e) => {
  const query = (e.target.value || "").trim().toLowerCase();
  cards.forEach((c) => {
    const name = (c.dataset.sectionName || "").toLowerCase();
    c.classList.toggle("is-hidden", Boolean(query) && !name.includes(query));
  });
  updateVisibleCount();
});
"""

    (out_dir / "index.html").write_text(html_content, encoding="utf-8")
    (out_dir / "styles.css").write_text(css_content, encoding="utf-8")
    (out_dir / "app.js").write_text(js_content, encoding="utf-8")

    manifest = {
        "brand": brand,
        "tagline": tagline,
        "sections": sections,
        "files": ["index.html", "styles.css", "app.js", "site-manifest.json"]
    }
    (out_dir / "site-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest["files"]


def main() -> None:
    parser = argparse.ArgumentParser(description="Free local multi-section website builder agent")
    parser.add_argument("--out", default="ui/full-site", help="Output directory for generated website")
    parser.add_argument("--brand", default="Full Site Platform", help="Brand title")
    parser.add_argument("--tagline", default="Single-page full website with interactive sections", help="Site tagline")
    parser.add_argument(
        "--sections",
        nargs="+",
        default=["Overview", "Capabilities", "Experience", "Projects", "Contact"],
        help="List of sections on the full website"
    )
    args = parser.parse_args()
    created = build_site(Path(args.out), args.brand, args.tagline, args.sections)
    print(json.dumps({"outputDir": args.out, "createdFiles": created, "sectionsCount": len(args.sections)}))


if __name__ == "__main__":
    main()
