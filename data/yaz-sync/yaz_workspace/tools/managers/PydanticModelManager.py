from pydantic import BaseModel

class PydanticModel(BaseModel):
    name: str
    description: str

class PydanticModelManager:
    def __init__(self):
        self.models = []

    def create_model(self, name, description):
        model = PydanticModel(name=name, description=description)
        self.models.append(model)

    def get_models(self):
        return self.models