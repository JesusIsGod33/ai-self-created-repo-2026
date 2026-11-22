import networkx as nx
import os

class ToolNameManager:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.tool_names = set()

    def add_tool(self, tool_name):
        self.tool_names.add(tool_name)
        self.graph.add_node(tool_name)

    def add_dependency(self, tool_name1, tool_name2):
        self.graph.add_edge(tool_name1, tool_name2)

    def has_chain_loop(self):
        try:
            cycle = nx.find_cycle(self.graph)
            return True
        except nx.NetworkXNoCycle:
            return False

    def get_tool_names(self):
        return list(self.tool_names)

    def save_tool_names(self):
        with open('tool_names.txt', 'w') as f:
            for tool_name in self.tool_names:
                f.write(tool_name + '\n')

    def load_tool_names(self):
        if os.path.exists('tool_names.txt'):
            with open('tool_names.txt', 'r') as f:
                self.tool_names = set(line.strip() for line in f.readlines())
                self.graph.add_nodes_from(self.tool_names)

def main():
    manager = ToolNameManager()
    manager.load_tool_names()
    while True:
        print("1. Add tool")
        print("2. Add dependency")
        print("3. Check for chain loop")
        print("4. Get tool names")
        print("5. Save tool names")
        print("6. Exit")
        choice = input("Enter your choice: ")
        if choice == "1":
            tool_name = input("Enter tool name: ")
            manager.add_tool(tool_name)
        elif choice == "2":
            tool_name1 = input("Enter tool name 1: ")
            tool_name2 = input("Enter tool name 2: ")
            manager.add_dependency(tool_name1, tool_name2)
        elif choice == "3":
            if manager.has_chain_loop():
                print("Chain loop detected")
            else:
                print("No chain loop detected")
        elif choice == "4":
            print(manager.get_tool_names())
        elif choice == "5":
            manager.save_tool_names()
        elif choice == "6":
            break
        else:
            print("Invalid choice")

if __name__ == "__main__":
    main()