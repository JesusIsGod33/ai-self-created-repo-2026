import importlib
import subprocess

class ModuleHandler:
    def __init__(self, module_name):
        self.module_name = module_name

    def import_module(self):
        try:
            module = importlib.import_module(self.module_name)
            print(f"{self.module_name} module imported successfully")
            return module
        except ImportError:
            print(f"Failed to import {self.module_name} module")
            return None

    def install_module(self):
        try:
            subprocess.check_call([f"pip install {self.module_name}"])
            print(f"{self.module_name} module installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"Failed to install {self.module_name} module: {e}")