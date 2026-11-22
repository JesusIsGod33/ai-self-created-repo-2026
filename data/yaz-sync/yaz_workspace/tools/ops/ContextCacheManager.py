#!/home/infuselink/yaz_env/bin/python3
import os
import re
import json
import sys
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

# ==============================================================================
# YAZ CONTEXT CACHE MANAGER (SEMANTIC COMPRESSION & LOCAL INDEXER)
# ==============================================================================

class ContextCacheManager:
    def __init__(self):
        self.console = Console()
        self.cache_path = os.path.expanduser("~/memory/grounding/context_cache.json")
        self.search_paths = [
            os.path.expanduser("~/yaz_workspace"),
            os.path.expanduser("~/ai-memory-bank"),
            os.path.expanduser("~/vault")
        ]

    def tokenize(self, text):
        """Extracts normalized alphanumeric tokens from text."""
        return list(set(re.findall(r'[a-zA-Z0-9_]+', text.lower())))

    def index_workspace(self):
        self.console.print("[bold blue]Initiating Dynamic Workspace Indexing...[/]")
        index = {}
        indexed_count = 0

        for path in self.search_paths:
            if not os.path.exists(path):
                continue
            for root, _, files in os.walk(path):
                if any(x in root for x in ["yaz_env", ".git", ".cache", ".venv", "venv", "__pycache__"]):
                    continue
                for f in files:
                    if f.endswith((".py", ".env", ".json", ".txt", ".md", ".sh")) and f not in ["yaz_master.py", "main.py"]:
                        file_path = os.path.join(root, f)
                        try:
                            with open(file_path, "r", encoding="utf-8", errors="ignore") as fh:
                                raw_content = fh.read()
                            
                            # Standardize structural payload
                            tokens = self.tokenize(raw_content)
                            index[f] = {
                                "path": file_path,
                                "size_bytes": len(raw_content),
                                "tokens": tokens,
                                "summary": raw_content[:800]  # Store context window slice
                            }
                            indexed_count += 1
                        except Exception as e:
                            continue

        with open(self.cache_path, "w", encoding="utf-8") as out:
            json.dump(index, out, indent=4)
            
        self.console.print(f"[bold green]Success:[/] Generated semantic index for [cyan]{indexed_count}[/] local workspace assets.")
        return index

    def query_context(self, user_query, top_k=5):
        """Performs token-overlap (Jaccard similarity) matches to retrieve top-K relevant contexts."""
        if not os.path.exists(self.cache_path):
            index = self.index_workspace()
        else:
            with open(self.cache_path, "r", encoding="utf-8") as f:
                index = json.load(f)

        query_tokens = set(self.tokenize(user_query))
        rankings = []

        for name, data in index.items():
            doc_tokens = set(data.get("tokens", []))
            if not doc_tokens:
                continue
            
            # Intersection over Union (Jaccard Similarity)
            intersection = query_tokens.intersection(doc_tokens)
            union = query_tokens.union(doc_tokens)
            score = len(intersection) / len(union) if union else 0.0
            
            rankings.append((score, name, data))

        # Sort by relevance score descending
        rankings.sort(key=lambda x: x[0], reverse=True)
        
        # Build optimized context block
        compiled_context = "=== DYNAMICALLY RETRIEVED CONTEXT ===\n"
        table = Table(title="Semantic Context Resolution", show_header=True, header_style="bold magenta")
        table.add_column("Asset", style="cyan")
        table.add_column("Path", style="dim")
        table.add_column("Score", style="green")

        for score, name, data in rankings[:top_k]:
            if score > 0.0 or len(rankings) <= top_k:
                compiled_context += f"\n--- Context File: {name} (Path: {data['path']}) ---\n{data['summary']}\n"
                table.add_row(name, data['path'], f"{score:.4f}")
                
        self.console.print(table)
        return compiled_context

if __name__ == "__main__":
    manager = ContextCacheManager()
    if len(sys.argv) > 1:
        # Run local query
        print(manager.query_context(" ".join(sys.argv[1:])))
    else:
        # Build index
        manager.index_workspace()
