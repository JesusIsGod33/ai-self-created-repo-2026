#!/home/infuselink/yaz_env/bin/python3
import os
import sys
import subprocess
import requests
import json
from rich.console import Console
from rich.panel import Panel

class BulkPuller:
    def __init__(self):
        self.console = Console()
        self.token = os.getenv("GITHUB_TOKEN")
        self.dest_dir = os.path.expanduser("~/yaz_workspace/tools/managers/")
        os.makedirs(self.dest_dir, exist_ok=True)
        
        # Manifest containing corrected paths (for the previous 404s) and 33 new additions
        self.manifest = [
            # --- CORRECTED PATHS FOR PREVIOUS 404 FAILURES ---
            ("ciphers/base64_cipher.py", "Base64Encoder"),
            ("ciphers/atbash.py", "AtbashCipher"),
            ("data_structures/arrays/pairs_with_given_sum.py", "PairSumHasher"),
            ("data_structures/linked_list/deque_doubly.py", "Deque"),
            ("data_structures/queues/circular_queue.py", "CircularQueue"),
            ("data_structures/stacks/dijkstras_two_stack_algorithm.py", "DijkstraTwoStack"),
            ("graphs/bfs_shortest_path.py", "BfsShortestPath"),
            ("graphs/prim.py", "PrimMinimumSpanningTree"),
            ("graphs/kruskal.py", "KruskalMinimumSpanningTree"),
            
            # --- 33 NEW FOUNDATIONAL ALGORITHMS ---
            ("maths/factorial.py", "FactorialEngine"),
            ("maths/prime_check.py", "PrimeVerifier"),
            ("maths/collatz_sequence.py", "CollatzSequence"),
            ("maths/armstrong_numbers.py", "ArmstrongNumbers"),
            ("maths/average_mean.py", "AverageMean"),
            ("maths/power_of_two.py", "PowerOfTwo"),
            ("maths/perfect_number.py", "PerfectNumber"),
            ("maths/pythagoras.py", "Pythagoras"),
            ("maths/volume.py", "VolumeCalculator"),
            ("maths/area.py", "AreaCalculator"),
            ("maths/sigmoid.py", "SigmoidActivation"),
            ("maths/softmax.py", "SoftmaxActivation"),
            ("searches/binary_search.py", "BinarySearch"),
            ("searches/linear_search.py", "LinearSearch"),
            ("searches/interpolation_search.py", "InterpolationSearch"),
            ("sorts/bubble_sort.py", "BubbleSorter"),
            ("sorts/quick_sort.py", "QuickSorter"),
            ("sorts/merge_sort.py", "MergeSorter"),
            ("sorts/selection_sort.py", "SelectionSorter"),
            ("sorts/insertion_sort.py", "InsertionSorter"),
            ("sorts/counting_sort.py", "CountingSorter"),
            ("sorts/cocktail_shaker_sort.py", "CocktailShakerSorter"),
            ("sorts/comb_sort.py", "CombSorter"),
            ("sorts/gnome_sort.py", "GnomeSorter"),
            ("sorts/bogo_sort.py", "BogoSorter"),
            ("data_structures/stacks/postfix_evaluation.py", "PostfixEvaluator"),
            ("data_structures/stacks/infix_to_postfix_conversion.py", "InfixToPostfix"),
            ("data_structures/linked_list/singly_linked_list.py", "SinglyLinkedList"),
            ("ciphers/caesar_cipher.py", "CaesarCipherEngine"),
            ("maths/greatest_common_divisor.py", "GcdEngine"),
            ("maths/least_common_multiple.py", "LcmEngine"),
            ("maths/fibonacci.py", "FibonacciEngine"),
            ("searches/jump_search.py", "JumpSearchEngine")
        ]

    def pull_asset(self, path, dest_name):
        url = f"https://api.github.com/repos/TheAlgorithms/Python/contents/{path}?ref=master"
        headers = {
            "Accept": "application/vnd.github.v3.raw"
        }
        if self.token:
            headers["Authorization"] = f"token {self.token}"
            
        try:
            res = requests.get(url, headers=headers, timeout=10)
            if res.status_code == 200:
                dest_path = os.path.join(self.dest_dir, f"{dest_name}.py")
                with open(dest_path, "w", encoding="utf-8") as f:
                    f.write(res.text)
                os.chmod(dest_path, 0o755)
                self.console.print(f"[green]✓ Ingested:[/] {dest_name} (Path: {path})")
                return True
            else:
                self.console.print(f"[red]✗ Failed:[/] {dest_name} (Status: {res.status_code})")
                return False
        except Exception as e:
            self.console.print(f"[red]✗ Error:[/] {dest_name} ({e})")
            return False

    def execute_bulk_sync(self):
        self.console.print(Panel("[bold cyan]YAZ Bulk Ingestor initialized. Deploying additions and corrections...[/]"))
        success_count = 0
        
        for path, dest_name in self.manifest:
            if self.pull_asset(path, dest_name):
                success_count += 1
                
        self.console.print(f"\n[bold green]Ingestion complete. {success_count}/{len(self.manifest)} assets successfully written to disk.[/]")
        
        # Run compiler once at the end of the batch to save CPU/disk I/O cycles
        self.console.print("[bold yellow]Re-indexing system-wide workspace context...[/]")
        interpreter = os.path.expanduser("~/yaz_env/bin/python3")
        subprocess.run([interpreter, os.path.expanduser("~/yaz_workspace/tools/ops/ContextCacheManager.py")])

if __name__ == "__main__":
    BulkPuller().execute_bulk_sync()
