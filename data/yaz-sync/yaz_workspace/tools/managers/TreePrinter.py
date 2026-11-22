class Node:
    def __init__(self, value):
        self.value = value
        self.children = []

def print_tree(node, indent=0):
    print('  ' * indent + node.value)
    for child in node.children:
        print_tree(child, indent + 1)

# Create the tree structure
root = Node('Root')
child1 = Node('Child 1')
child2 = Node('Child 2')
grandchild1 = Node('Grandchild 1')
grandchild2 = Node('Grandchild 2')

root.children = [child1, child2]
child1.children = [grandchild1, grandchild2]

# Print the tree
print_tree(root)