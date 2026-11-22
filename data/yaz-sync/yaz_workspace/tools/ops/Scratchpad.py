#!/home/infuselink/yaz_env/bin/python3
import os
import sys
import json

# ==============================================================================
# YAZ PERSISTENT STATE SCRATCHPAD (JUPYTER REPL SIMULATOR)
# ==============================================================================

class Scratchpad:
    def __init__(self):
        self.state_file = os.path.expanduser("~/memory/grounding/scratchpad_state.json")
        self.session_variables = self.load_state()

    def load_state(self):
        """Loads persistent variables from the local storage file."""
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, "r") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def save_state(self):
        """Saves current variables to local storage."""
        try:
            with open(self.state_file, "w") as f:
                json.dump(self.session_variables, f, indent=4)
        except Exception as e:
            print(f"[ERROR] Failed to write state: {e}")

    def execute_code(self, code_block):
        print("[SCRATCHPAD] Initializing persistent execution context...")
        
        # Build execution context using loaded session variables
        context_globals = globals().copy()
        context_globals.update(self.session_variables)
        context_locals = {}

        try:
            # Capture standard output
            import io
            old_stdout = sys.stdout
            redirected_output = sys.stdout = io.StringIO()
            
            # Execute code block in the persistent context
            exec(code_block, context_globals, context_locals)
            
            sys.stdout = old_stdout
            execution_result = redirected_output.getvalue()

            # Update session variables with newly mutated local variables
            # Filter out non-serializable objects (like modules or classes) to maintain JSON integrity
            for k, v in context_locals.items():
                try:
                    json.dumps({k: v})  # Test serializability
                    self.session_variables[k] = v
                except TypeError:
                    continue

            self.save_state()
            print("[SUCCESS] Execution completed successfully.")
            if execution_result:
                print(f"Output:\n{execution_result}")
            else:
                print("[dim]No standard output returned.[/]")
        except Exception as e:
            sys.stdout = old_stdout
            print(f"[ERROR] Compilation / Execution Failure: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        Scratchpad().execute_code(sys.argv[1])
    else:
        # If run without arguments, display current active variable states
        sp = Scratchpad()
        print(f"=== Active Persistent Variable States ===\n{json.dumps(sp.session_variables, indent=4)}")
