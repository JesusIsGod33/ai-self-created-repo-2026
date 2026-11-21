import html
import json
from pathlib import Path


def verify(specs_path: Path) -> dict:
    specs = json.loads(specs_path.read_text(encoding="utf-8"))
    checked = []
    for spec in specs:
        out_dir = Path(spec["out"])
        required = ["index.html", "styles.css", "app.js", "site-manifest.json"]
        missing = [f for f in required if not (out_dir / f).is_file()]
        if missing:
            raise FileNotFoundError(f"{out_dir} missing files: {missing}")

        manifest = json.loads((out_dir / "site-manifest.json").read_text(encoding="utf-8"))
        index_html = (out_dir / "index.html").read_text(encoding="utf-8")
        app_js = (out_dir / "app.js").read_text(encoding="utf-8")

        for sec in spec["sections"]:
            escaped_sec = html.escape(sec)
            if sec not in index_html and escaped_sec not in index_html:
                raise ValueError(f"{out_dir}/index.html missing section '{sec}'")

        for token in ["inspector-drawer", "section-search", "pin-btn", "activity-log"]:
            if token not in index_html and token not in app_js:
                raise ValueError(f"{out_dir} missing interactive feature '{token}'")

        checked.append({
            "outputDir": str(out_dir),
            "brand": manifest.get("brand"),
            "sectionsVerified": len(spec["sections"]),
            "status": "verified"
        })

    return {"verifiedCount": len(checked), "sites": checked}


if __name__ == "__main__":
    specs_file = Path(__file__).resolve().parent / "templates" / "sites.json"
    print(json.dumps(verify(specs_file), indent=2))
