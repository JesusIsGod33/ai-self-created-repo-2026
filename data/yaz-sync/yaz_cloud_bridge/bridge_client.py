#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.request
import urllib.error

DEFAULT_ENDPOINT = os.environ.get("YAZ_API_URL", "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent")

def build_payload(system_instruction: str, user_prompt: str, max_tokens: int = 2048) -> bytes:
    body = {
        "system_instruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_prompt}]
            }
        ],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": 0.4
        }
    }
    return json.dumps(body).encode("utf-8")

def send_request(endpoint: str, api_key: str, payload_bytes: bytes) -> str:
    url = f"{endpoint}?key={api_key}" if api_key and "key=" not in endpoint else endpoint
    req = urllib.request.Request(
        url,
        data=payload_bytes,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            raw = resp.read().decode("utf-8")
            parsed = json.loads(raw)
            candidates = parsed.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                texts = [p.get("text", "") for p in parts if "text" in p]
                return "\n".join(texts).strip()
            return raw
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        return f"[HTTP {e.code}] {err_body}"
    except Exception as e:
        return f"[CLIENT ERROR] {e}"

def main():
    parser = argparse.ArgumentParser(description="Lightweight Chromebook Cloud Chat & Task Router")
    parser.add_argument("--message", "-m", type=str, help="Single message to send to cloud LLM")
    parser.add_argument("--task", "-t", type=str, help="Task goal for structured capability and prompt synthesis")
    parser.add_argument("--max-tokens", type=int, default=2048, help="Output token budget")
    args = parser.parse_args()

    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("Set GEMINI_API_KEY in your shell environment before running.", file=sys.stderr)
        sys.exit(1)

    system_prompt = (
        "You are a concise, structured technical assistant running over a lightweight client bridge. "
        "Provide clear conversational answers, lawful architecture patterns, safe schema designs, "
        "and verifiable troubleshooting steps without local heavy model dependencies."
    )

    if args.task:
        prompt = (
            f"Design a structured, lawful capability and prompt specification for the following task: {args.task}\n"
            "Include:\n"
            "1. Objective & Scope Boundaries\n"
            "2. Structured Input/Output Schema\n"
            "3. Reusable Prompt Template with <conceptual_placeholder> fields\n"
            "4. Verification & Fallback Checklist"
        )
    elif args.message:
        prompt = args.message
    else:
        print("Interactive Cloud Chat Ready (type 'exit' or 'quit' to stop).")
        while True:
            try:
                line = input("YAZ-CLOUD> ").strip()
            except (EOFError, KeyboardInterrupt):
                print()
                break
            if not line:
                continue
            if line.lower() in ("exit", "quit"):
                break
            out = send_request(DEFAULT_ENDPOINT, api_key, build_payload(system_prompt, line, args.max_tokens))
            print(f"\n{out}\n")
        return

    out = send_request(DEFAULT_ENDPOINT, api_key, build_payload(system_prompt, prompt, args.max_tokens))
    print(out)

if __name__ == "__main__":
    main()
