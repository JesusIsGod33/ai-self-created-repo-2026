class BalancedParenthesesChecker:
    def __init__(self, input_string):
        self.input_string = input_string

    def check_balance(self):
        stack = []
        parentheses_map = {")": "(", "}": "{", "]": "["}

        for char in self.input_string:
            if char in parentheses_map.values():
                stack.append(char)
            elif char in parentheses_map.keys():
                if not stack or stack.pop() != parentheses_map[char]:
                    return False

        return not stack

# Example usage:
checker = BalancedParenthesesChecker("({[]})")
print(checker.check_balance())  # Output: True

checker = BalancedParenthesesChecker("({[}]")
print(checker.check_balance())  # Output: False