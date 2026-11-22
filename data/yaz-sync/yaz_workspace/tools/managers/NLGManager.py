from manager_factory import BaseManager
import sys
from transformers import T5ForConditionalGeneration, T5Tokenizer

class NLGManager(BaseManager):
    def __init__(self):
        self.model = T5ForConditionalGeneration.from_pretrained('t5-base')
        self.tokenizer = T5Tokenizer.from_pretrained('t5-base')

    def generate_text(self, prompt):
        input_ids = self.tokenizer.encode(prompt, return_tensors='pt')
        output = self.model.generate(input_ids)
        return self.tokenizer.decode(output[0], skip_special_tokens=True)

    def run(self):
        print(f'[NLGManager] Operational')
        prompt = "Describe a sunny day at the beach."
        generated_text = self.generate_text(prompt)
        print(generated_text)

if __name__ == '__main__':
    nlg_manager = NLGManager()
    nlg_manager.run()