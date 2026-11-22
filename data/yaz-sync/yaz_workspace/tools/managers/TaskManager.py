import os
import subprocess

class TaskManager:
    def __init__(self):
        self.setup_file = "/home/infuselink/setup.py"
        self.package_file = "/home/infuselink/dist/Yaz_master-1.0.tar.gz"
        self.run_temp_script = "/path/to/run_temp.py"

    def check_setup_file(self):
        if not os.path.exists(self.setup_file):
            print("Error: setup.py file does not exist.")
            return False
        return True

    def check_package_file(self):
        if not os.path.exists(self.package_file):
            print("Error: Yaz_master-1.0.tar.gz file does not exist.")
            return False
        return True

    def run_run_temp_script(self, cmd):
        try:
            subprocess.run([self.run_temp_script, cmd], check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error: {e}")

# Example usage:
task_manager = TaskManager()
if task_manager.check_setup_file() and task_manager.check_package_file():
    task_manager.run_run_temp_script("example_cmd")