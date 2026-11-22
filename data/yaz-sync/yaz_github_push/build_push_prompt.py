#!/usr/bin/env python3
import argparse
from pathlib import Path

PROMPT_TEMPLATE = """Push local files from {source_dir} into the GitHub YAZ repository ({remote_url}) on branch {branch} using a safe staging copy at {stage_dir}.
1. Stage files with rsync while excluding virtual environments, archives, caches, databases, logs, and sensitive files.
2. Initialize or update the git repository inside {stage_dir}, stage all changes, commit with a timestamp, and push to origin {branch}.
3. Print clear status output and verify that no heavy local model weights or secret files were staged.
"""

def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a copy-pasteable prompt for pushing local files to YAZ on GitHub")
    parser.add_argument("--source", default=str(Path.home()), help="Local directory to push")
    parser.add_argument("--remote", default="https://github.com/<your-username>/YAZ.git", help="Target YAZ GitHub repository URL")
    parser.add_argument("--branch", default="main", help="Target Git branch")
    parser.add_argument("--stage", default=str(Path.home() / "yaz_github_stage"), help="Staging folder path")
    args = parser.parse_args()

    print(
        PROMPT_TEMPLATE.format(
            source_dir=args.source,
            remote_url=args.remote,
            branch=args.branch,
            stage_dir=args.stage,
        ).strip()
    )

if __name__ == "__main__":
    main()
