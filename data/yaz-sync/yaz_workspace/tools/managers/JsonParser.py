import json

class JsonParser:
    def __init__(self, json_data):
        self.json_data = json_data

    def parse(self):
        try:
            return json.loads(self.json_data)
        except Exception as e:
            return str(e)