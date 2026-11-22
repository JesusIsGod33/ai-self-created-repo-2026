class Node:
    def __init__(self, name):
        self.name = name
        self.children = []

    def add_child(self, node):
        self.children.append(node)

    def print_tree(self, indent=0):
        print('  ' * indent + self.name)
        for child in self.children:
            child.print_tree(indent + 1)

# Create the tree structure
root = Node('Root')
child1 = Node('Child 1')
child2 = Node('Child 2')
grandchild1 = Node('Grandchild 1')
grandchild2 = Node('Grandchild 2')

root.add_child(child1)
root.add_child(child2)
child1.add_child(grandchild1)
child1.add_child(grandchild2)

# Print the tree
root.print_tree()