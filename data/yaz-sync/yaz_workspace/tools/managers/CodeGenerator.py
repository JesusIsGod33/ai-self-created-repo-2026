import os

class CodeGenerator:
    def __init__(self, template_path, output_path):
        self.template_path = template_path
        self.output_path = output_path

    def generate_code(self):
        try:
            # Read the template file
            with open(self.template_path, "r") as f:
                template_code = f.read()

            # Generate the code by replacing placeholders
            generated_code = template_code.replace("{{ placeholder }}", "Generated code")

            # Write the generated code to the output file
            with open(self.output_path, "w") as f:
                f.write(generated_code)

            print(f"Code generated successfully at {self.output_path}")
            return True
        except Exception as e:
            print(f"Code generation failed: {str(e)}")
            return False