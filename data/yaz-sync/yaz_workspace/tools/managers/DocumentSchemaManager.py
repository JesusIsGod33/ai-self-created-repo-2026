# Import necessary libraries
import json
from typing import List, Dict

# Define a class to manage document schemas
class DocumentSchemaManager:
    def __init__(self):
        self.schemas = {}

    # Method to add a new schema
    def add_schema(self, name: str, schema: Dict):
        self.schemas[name] = schema

    # Method to retrieve a schema
    def get_schema(self, name: str) -> Dict:
        return self.schemas.get(name)

    # Method to update a schema
    def update_schema(self, name: str, schema: Dict):
        if name in self.schemas:
            self.schemas[name] = schema
        else:
            print("Schema not found")

    # Method to delete a schema
    def delete_schema(self, name: str):
        if name in self.schemas:
            del self.schemas[name]
        else:
            print("Schema not found")

# Create an instance of the DocumentSchemaManager
manager = DocumentSchemaManager()

# Add a new schema
schema = {
    "name": "example",
    "fields": [
        {"name": "title", "type": "string"},
        {"name": "description", "type": "string"}
    ]
}
manager.add_schema("example", schema)

# Retrieve a schema
print(manager.get_schema("example"))

# Update a schema
updated_schema = {
    "name": "example",
    "fields": [
        {"name": "title", "type": "string"},
        {"name": "description", "type": "string"},
        {"name": "author", "type": "string"}
    ]
}
manager.update_schema("example", updated_schema)

# Delete a schema
manager.delete_schema("example")