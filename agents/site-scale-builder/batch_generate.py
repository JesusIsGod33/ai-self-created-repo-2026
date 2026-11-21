import json
import subprocess
import sys
from pathlib import Path


def run_batch(specs_file: Path) -> list[dict]:
    specs = json.loads(specs_file.read_text(encoding="utf-8"))
    results = []
    builder_script = Path(__file__).resolve().parent / "build_full_site.py"
    for spec in specs:
        cmd = [
            sys.executable,
            str(builder_script),
            "--out",
            spec["out"],
            "--brand",
            spec["brand"],
            "--tagline",
            spec["tagline"],
            "--sections",
            *spec["sections"]
        ]
        proc = subprocess.run(cmd, check=True, capture_output=True, text=True)
        results.append(json.loads(proc.stdout.strip()))
    return results


def main() -> None:
    default_specs = Path(__file__).resolve().parent / "templates" / "sites.json"
    default_specs.parent.mkdir(parents=True, exist_ok=True)
    if not default_specs.exists():
        default_specs.write_text(
            json.dumps(
                [
                    {
                        "out": "ui/full-site",
                        "brand": "Career & Systems Hub",
                        "tagline": "Complete single-page multi-section site with no subpage split",
                        "sections": ["Summary", "Experience", "Credentials", "Projects", "Contact"]
                    }
                ],
                indent=2
            ),
            encoding="utf-8"
        )
    out = run_batch(default_specs)
    print(json.dumps({"generatedSites": len(out), "items": out}, indent=2))


if __name__ == "__main__":
    main()
