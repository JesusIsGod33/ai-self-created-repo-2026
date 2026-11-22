class ToolManager:
    def __init__(self):
        self.tools = {}

    def add_tool(self, name):
        self.tools[name] = {}

    def remove_tool(self, name):
        if name in self.tools:
            del self.tools[name]
        else:
            print(f"Tool '{name}' not found.")

# Create an instance of the ToolManager class
tool_manager = ToolManager()

# Add a new tool
tool_manager.add_tool("TypeHelper")

# Remove a tool
tool_manager.remove_tool("TypeHelper")