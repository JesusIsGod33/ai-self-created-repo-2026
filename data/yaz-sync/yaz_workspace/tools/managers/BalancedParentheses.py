class Stack:
    def __init__(self):
        self.stack = []

    def push(self, item):
        self.stack.append(item)

    def pop(self):
        if not self.is_empty():
            return self.stack.pop()
        return None

    def is_empty(self):
        return len(self.stack) == 0

    def peek(self):
        if not self.is_empty():
            return self.stack[-1]
        return None

def is_balanced(s):
    stack = Stack()
    for char in s:
        if char in ['(', '[', '{']:
            stack.push(char)
        elif char in [')', ']', '}']:
            if stack.is_empty():
                return False
            top = stack.pop()
            if (char == ')' and top != '(') or (char == ']' and top != '[') or (char == '}' and top != '{'):
                return False
    return stack.is_empty()

# Test the function
print(is_balanced("({[]})"))  # True
print(is_balanced("({[}]"))   # False