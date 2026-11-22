#!/home/infuselink/yaz_env/bin/python3
import os
import ast
import json
import sys
from rich.console import Console
from rich.panel import Panel
from rich.tree import Tree
from rich.table import Table

# ==============================================================================
# SYSTEM EVOLUTION ENGINE (AST PARSER & DEEP-DEPENDENCY RECONCILER)
# ==============================================================================

class ParentAnnotator(ast.NodeVisitor):
    """AST helper node to annotate parents on nodes recursively."""
    def generic_visit(self, node):
        for child in ast.iter_child_nodes(node):
            child.parent = node
            self.visit(child)

class ASTExplorer(ast.NodeVisitor):
    def __init__(self):
        self.imports = []
        self.classes = {}
        self.functions = []

    def visit_Import(self, node):
        for alias in node.names:
            self.imports.append(alias.name)
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        if node.module:
            self.imports.append(node.module)
        self.generic_visit(node)

    def visit_ClassDef(self, node):
        methods = [n.name for n in node.body if isinstance(n, ast.FunctionDef)]
        bases = []
        for base in node.bases:
            try:
                bases.append(ast.unparse(base))
            except Exception:
                pass
        self.classes[node.name] = {
            "methods": methods,
            "bases": bases,
            "docstring": ast.get_docstring(node)
        }
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        # Only log top-level module functions, not class methods
        is_method = False
        curr = node
        while hasattr(curr, "parent"):
            if isinstance(curr.parent, ast.ClassDef):
                is_method = True
                break
            curr = curr.parent
        if not is_method:
            self.functions.append(node.name)
        self.generic_visit(node)

class SystemEvolutionEngine:
    def __init__(self):
        self.console = Console()
        self.workspace_root = os.path.expanduser("~/yaz_workspace")
        self.output_json = os.path.expanduser("~/memory/grounding/system_topology.json")
        self.topology = {}

    def analyze_file(self, file_path):
        """Attempts to parse and index file metadata using Abstract Syntax Trees."""
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                code_content = f.read()
            
            tree = ast.parse(code_content, filename=file_path)
            # Annotate nodes with parent links to differentiate methods from functions
            ParentAnnotator().visit(tree)
            
            explorer = ASTExplorer()
            explorer.visit(tree)
            
            return {
                "imports": list(set(explorer.imports)),
                "classes": explorer.classes,
                "functions": explorer.functions
            }
        except Exception as e:
            return {"error": str(e)}

    def compile_topology(self):
        self.console.print("[bold blue]Initiating Deep AST Scan on Local Workspace...[/]")
        
        for root, _, files in os.walk(self.workspace_root):
            if any(x in root for x in ["yaz_env", ".git", ".cache", "venv"]):
                continue
            for f in files:
                if f.endswith(".py") and f != "SystemEvolutionEngine.py":
                    full_path = os.path.join(root, f)
                    rel_path = os.path.relpath(full_path, self.workspace_root)
                    self.topology[rel_path] = self.analyze_file(full_path)

        # Write parsed topological structure to memory
        with open(self.output_json, "w") as out:
            json.dump(self.topology, out, indent=4)
        
        self.console.print(f"[bold green]Success:[/] Generated System Topology Map at [dim]{self.output_json}[/]")

    def display_ascii_topology(self):
        """Constructs a beautifully structured Rich Tree representation of the codebase."""
        tree = Tree("[bold cyan]YAZ Workspace Topology (Abstract Syntax Tree)[/]")
        
        for file, data in self.topology.items():
            if "error" in data:
                tree.add(f"[red]• {file} (Parsing Error: {data['error']})[/]")
                continue
                
            node = tree.add(f"[green]📂 {file}[/]")
            
            # Sub-node: Imports
            if data["imports"]:
                imp_node = node.add("[dim]Imports[/]")
                for imp in data["imports"]:
                    imp_node.add(f"[yellow]{imp}[/]")
            
            # Sub-node: Classes
            if data["classes"]:
                cls_node = node.add("[bold magenta]Classes[/]")
                for cls_name, info in data["classes"].items():
                    base_str = f" inherits from ({', '.join(info['bases'])})" if info['bases'] else ""
                    c_detail = cls_node.add(f"[bold yellow]{cls_name}[/]{base_str}")
                    if info["methods"]:
                        for meth in info["methods"]:
                            c_detail.add(f"[blue]{meth}()[/]")
            
            # Sub-node: Functions
            if data["functions"]:
                func_node = node.add("[bold blue]Module Functions[/]")
                for func in data["functions"]:
                    func_node.add(f"[blue]{func}()[/]")
                    
        self.console.print(Panel(tree, border_style="cyan"))

    def reconcile_dependencies(self):
        """Analyzes missing local files referenced in imports and creates placeholders."""
        self.console.print("[bold yellow]Scanning for missing local module imports...[/]")
        missing_count = 0
        
        for file, data in self.topology.items():
            if "error" in data:
                continue
            for imp in data["imports"]:
                # If importing a custom module under tools.managers but file doesn't exist
                if "tools.managers" in imp:
                    name = imp.split(".")[-1]
                    target_path = os.path.join(self.workspace_root, "tools/managers", f"{name}.py")
                    if not os.path.exists(target_path):
                        self.console.print(f"[bold red]Defect Found:[/] Missing module dependency [yellow]{name}.py[/]")
                        # Auto-generate conforming empty placeholder
                        with open(target_path, "w") as f:
                            f.write(f"#!/home/infuselink/yaz_env/bin/python3\n# Auto-generated dependency placeholder\nclass {name}:\n    pass\n")
                        os.chmod(target_path, 0o755)
                        missing_count += 1
                        
        if missing_count > 0:
            self.console.print(f"[bold green]Reconciliation Complete:[/] Auto-generated [cyan]{missing_count}[/] missing local modules.")
        else:
            self.console.print("[bold green]Zero dependencies require reconciliation. Workspace fully aligned.[/]")

    def run(self):
        self.compile_topology()
        self.console.print("\n")
        self.display_ascii_topology()
        self.console.print("\n")
        self.reconcile_dependencies()

if __name__ == "__main__":
    SystemEvolutionEngine().run()
