import hashlib

class Sha256Verifier:
    def __init__(self, checksum: str):
        self.checksum = checksum

    def verify(self, input_string: str = ''):
        input_hash = hashlib.sha256(input_string.encode()).hexdigest()
        return input_hash == self.checksum

# Example usage:
verifier = Sha256Verifier("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
print(verifier.verify())