# ModuleRegistry.py
import importlib
import os

class ModuleRegistry:
    def __init__(self):
        self.modules = []

    def discover_modules(self):
        for file in os.listdir("."):
            if file.endswith(".py") and file != "Yaz_master.py":
                module_name = file.replace(".py", "")
                module = importlib.import_module(module_name)
                self.modules.append(module)

    def add_modules(self, yaz_base):
        for module in self.modules:
            if hasattr(module, "Module"):
                yaz_base.add_module(module.Module())