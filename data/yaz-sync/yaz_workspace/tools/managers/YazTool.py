import importlib

class YazTool:
    def __init__(self, module_name):
        self.module_name = module_name

    def run(self):
        try:
            module = importlib.import_module(self.module_name)
            if hasattr(module, 'main'):
                module.main()
            else:
                print(f"{self.module_name} module does not have a main function")
        except ImportError:
            print(f"Failed to import {self.module_name} module")

# Usage
tool = YazTool('Yaz_master')
tool.run()