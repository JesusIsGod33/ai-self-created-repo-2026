import argparse
import json
from pathlib import Path


def build_site(out_dir: Path, brand: str, tagline: str, sections: list[str]) -> list[str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    nav_items = "\n".join(
        f'        <a href="#{sec.lower().replace(" ", "-")}">{sec}</a>' for sec in sections
    )
    section_blocks = "\n".join(
        f"""    <section id="{sec.lower().replace(" ", "-")}" class="panel">
      <h2>{sec}</h2>
      <p>Full multi-section content block generated for {brand} ({tagline}) under {sec}.</p>
      <button type="button" class="action-btn" data-section="{sec}">Inspect {sec}</button>
    </section>"""
        for sec in sections
    )

    html_content = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{brand} - Full Website</title>
  <link rel="stylesheet" href="./styles.css" />
</head>
<body>
  <header class="topbar">
    <div class="wrap nav-row">
      <div class="logo">{brand}</div>
      <nav class="nav-links">
{nav_items}
      </nav>
    </div>
  </header>

  <section class="hero">
    <div class="wrap">
      <p class="eyebrow">Full Multi-Section Website</p>
      <h1>{brand}</h1>
      <p class="sub">{tagline}</p>
      <div class="hero-actions">
        <button type="button" id="btn-expand-all" class="primary-btn">Highlight All Sections</button>
        <button type="button" id="btn-reset-all" class="ghost-btn">Reset Highlights</button>
      </div>
    </div>
  </section>

  <main class="wrap sections-grid">
{section_blocks}
    <section id="output-console" class="panel console-panel">
      <h2>Live Agent Output</h2>
      <pre id="site-output">Ready to run actions across {len(sections)} sections.</pre>
    </section>
  </main>

  <script type="module" src="./app.js"></script>
</body>
</html>
"""

    css_content = """* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  background: #0b1120;
  color: #f8fafc;
  line-height: 1.55;
}
.wrap {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.25rem;
}
.topbar {
  position: sticky;
  top: 0;
  background: rgba(11, 17, 32, 0.92);
  border-bottom: 1px solid #1e293b;
  backdrop-filter: blur(8px);
  z-index: 10;
}
.nav-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  min-height: 64px;
  flex-wrap: wrap;
}
.logo { font-weight: 800; font-size: 1.05rem; }
.nav-links { display: flex; gap: 1rem; flex-wrap: wrap; }
.nav-links a { color: #cbd5e1; text-decoration: none; font-size: 0.9rem; font-weight: 600; }
.nav-links a:hover { color: #38bdf8; }
.hero {
  padding: 3.2rem 0 2rem;
  border-bottom: 1px solid #1e293b;
}
.eyebrow { color: #38bdf8; text-transform: uppercase; font-size: 0.78rem; font-weight: 700; margin: 0 0 0.4rem; }
.hero h1 { margin: 0; font-size: 2.2rem; }
.sub { color: #94a3b8; max-width: 68ch; margin: 0.6rem 0 1.2rem; }
.hero-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  padding: 2rem 1.25rem 3rem;
}
.panel {
  background: #111827;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.85rem;
}
.panel.is-highlighted { border-color: #38bdf8; box-shadow: 0 0 0 1px #38bdf8; }
.panel h2 { margin: 0; font-size: 1.1rem; }
.panel p { margin: 0; color: #cbd5e1; font-size: 0.92rem; }
.primary-btn, .ghost-btn, .action-btn {
  border-radius: 8px;
  padding: 0.55rem 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid #334155;
}
.primary-btn { background: #38bdf8; color: #081221; border-color: #38bdf8; }
.ghost-btn, .action-btn { background: #1e293b; color: #f8fafc; }
.console-panel { grid-column: 1 / -1; }
pre {
  margin: 0;
  background: #060a13;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 0.9rem;
  white-space: pre-wrap;
  font-size: 0.84rem;
}
"""

    js_content = """const out = document.getElementById("site-output");
const panels = [...document.querySelectorAll(".panel[id]")].filter((el) => el.id !== "output-console");

document.getElementById("btn-expand-all")?.addEventListener("click", () => {
  panels.forEach((p) => p.classList.add("is-highlighted"));
  out.textContent = `Highlighted ${panels.length} full-page sections at ${new Date().toISOString()}`;
});

document.getElementById("btn-reset-all")?.addEventListener("click", () => {
  panels.forEach((p) => p.classList.remove("is-highlighted"));
  out.textContent = `Reset highlights across ${panels.length} sections at ${new Date().toISOString()}`;
});

document.querySelectorAll(".action-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const sec = btn.dataset.section || "Section";
    out.textContent = `Executed full-page action for [${sec}] at ${new Date().toISOString()}`;
  });
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
