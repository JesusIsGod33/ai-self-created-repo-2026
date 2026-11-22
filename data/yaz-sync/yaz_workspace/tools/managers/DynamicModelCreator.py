from pydantic import BaseModel, Field
from typing import Dict, Any

class DynamicModelCreator:
    def __init__(self, model_info: Dict[str, Any]):
        self.model_info = model_info

    def create_model(self):
        fields = {}
        for field in self.model_info['fields']:
            fields[field['name']] = Field(..., type_=field['type'], description=field['description'])
        model = type(self.model_info['name'], (BaseModel,), fields)
        return model

# Example usage:
model_info = {
    'name': 'ExampleModel',
    'fields': [
        {'name': 'title', 'type': str, 'description': 'The title of the example'},
        {'name': 'description', 'type': str, 'description': 'The description of the example'}
    ]
}

creator = DynamicModelCreator(model_info)
ExampleModel = creator.create_model()

# Now you can use the ExampleModel
example = ExampleModel(title='Example Title', description='This is an example')
print(example)