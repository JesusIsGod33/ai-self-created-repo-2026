import numpy as np
from CodeCompletionAnalyzer import CodeCompletionAnalyzer

class IDE:
    def __init__(self, name):
        self.name = name

    def register_completion_provider(self, analyzer):
        print(f"Registering completion provider for {self.name}")
        # Implement the logic to register the completion provider
        self.completion_provider = analyzer

class IDEIntegration:
    def __init__(self, ide):
        self.ide = ide
        self.analyzer = CodeCompletionAnalyzer()

    def integrate_analyzer(self):
        # Integrate the CodeCompletionAnalyzer with the IDE
        self.ide.register_completion_provider(self.analyzer)

    def get_completion(self, code_snippet, language):
        # Use the CodeCompletionAnalyzer to get the completion
        completion = self.analyzer.analyze_completion(code_snippet, language)
        return completion

# Create instances of different IDEs
pycharm = IDE("PyCharm")
vscode = IDE("VSCode")
eclipse = IDE("Eclipse")

# Create instances of IDEIntegration for each IDE
pycharm_integration = IDEIntegration(pycharm)
vscode_integration = IDEIntegration(vscode)
eclipse_integration = IDEIntegration(eclipse)

# Integrate the CodeCompletionAnalyzer with each IDE
pycharm_integration.integrate_analyzer()
vscode_integration.integrate_analyzer()
eclipse_integration.integrate_analyzer()

# Test the integration with different code snippets
code_snippets = [
    "def greet(name):",
    "public class Person {",
    "int add(int a, int b) {",
    "function greet(name) {"
]

languages = ["Python", "Java", "C++", "JavaScript"]

for code_snippet, language in zip(code_snippets, languages):
    completion = pycharm_integration.get_completion(code_snippet, language)
    print(f"Completion for {language} code snippet: {completion}")