class ModuleLoader:
    def __init__(self):
        pass

    def load_module(self, module_name):
        try:
            return __import__(module_name)
        except ImportError:
            return None