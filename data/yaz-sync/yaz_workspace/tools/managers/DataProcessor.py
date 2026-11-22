import numpy as np

class DataProcessor:
    def __init__(self, data):
        self.data = data

    def process(self):
        # Example processing function
        return np.mean(self.data)

# Example usage
if __name__ == "__main__":
    X = np.array([[1, 2], [3, 4], [5, 6]])
    print("X shape:", X.shape)
    if X.size > 0:
        print("X is not empty")
    else:
        print("X is empty")

    processor = DataProcessor(X)
    result = processor.process()
    print("Result:", result)