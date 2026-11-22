import os
import json

class ContextManager:
    def __init__(self):
        self.context_data = {}

    def store_context(self, key, value):
        self.context_data[key] = value
        with open('context.json', 'w') as f:
            json.dump(self.context_data, f)

    def retrieve_context(self, key):
        if key in self.context_data:
            return self.context_data[key]
        else:
            return None

    def update_context(self, key, value):
        if key in self.context_data:
            self.context_data[key] = value
            with open('context.json', 'w') as f:
                json.dump(self.context_data, f)
        else:
            print("Key not found in context data")

# Initialize the ContextManager
context_manager = ContextManager()

# Store some context data
context_manager.store_context('user_name', 'John Doe')

# Retrieve the stored context data
print(context_manager.retrieve_context('user_name'))  # Output: John Doe