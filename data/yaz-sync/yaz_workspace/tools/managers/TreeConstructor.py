class Node:
    def __init__(self, value):
        self.value = value
        self.children = []

class Tree:
    def __init__(self):
        self.root = None

    def add_node(self, value, parent_value=None):
        new_node = Node(value)
        if not self.root:
            self.root = new_node
        else:
            parent_node = self.find_node(parent_value)
            if parent_node:
                parent_node.children.append(new_node)
            else:
                raise ValueError("Parent node not found")
        return new_node

    def find_node(self, value, node=None):
        if not node:
            node = self.root
        if node.value == value:
            return node
        for child in node.children:
            found_node = self.find_node(value, child)
            if found_node:
                return found_node
        return None

    def print_tree(self, node=None, level=0):
        if not node:
            node = self.root
        print("  " * level + str(node.value))
        for child in node.children:
            self.print_tree(child, level + 1)

# Create a new tree
tree = Tree()

# Add nodes to the tree
tree.add_node("Root")
tree.add_node("Child 1", "Root")
tree.add_node("Child 2", "Root")
tree.add_node("Grandchild 1", "Child 1")
tree.add_node("Grandchild 2", "Child 1")

# Print the tree
tree.print_tree()