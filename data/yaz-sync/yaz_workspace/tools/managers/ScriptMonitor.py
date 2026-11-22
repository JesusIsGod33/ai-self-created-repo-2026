import subprocess
from AutoCodeOptimizer import AutoCodeOptimizer

class ScriptMonitor:
    def __init__(self, script_path):
        self.script_path = script_path

    def monitor_script_execution(self):
        try:
            # Optimize the script before execution
            optimizer = AutoCodeOptimizer(self.script_path)
            optimizer.optimize_code()

            # Run the script
            output = subprocess.check_output(["python", self.script_path])
            print(f"Script {self.script_path} executed successfully.")
            return output.decode("utf-8")
        except subprocess.CalledProcessError as e:
            print(f"Script {self.script_path} failed with error code {e.returncode}.")
            return None

    def run_code_analysis(self):
        try:
            # Run code analysis on the script
            optimizer = AutoCodeOptimizer(self.script_path)
            return optimizer.run_code_analysis()
        except Exception as e:
            print(f"Code analysis for {self.script_path} failed: {str(e)}")
            return None