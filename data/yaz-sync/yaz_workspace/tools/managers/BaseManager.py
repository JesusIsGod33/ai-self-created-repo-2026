class BaseManager:
    def __init__(self, target):
        self.target = target
        self.auto_tool_generator = AutoToolGenerator()

    def execute(self):
        return f"[BaseManager] Active on {self.target}"