class BaseManager:
    def __init__(self):
        pass

    def execute(self):
        raise NotImplementedError("Subclasses must implement the execute method")

    def configure(self, **kwargs):
        raise NotImplementedError("Subclasses must implement the configure method")