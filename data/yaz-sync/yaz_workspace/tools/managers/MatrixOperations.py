import numpy as np

class MatrixOperations:
    def __init__(self, matrix):
        self.matrix = np.array(matrix)

    def add(self, other_matrix):
        return self.matrix + np.array(other_matrix)

    def subtract(self, other_matrix):
        return self.matrix - np.array(other_matrix)

    def multiply(self, other_matrix):
        return np.dot(self.matrix, np.array(other_matrix))

    def transpose(self):
        return self.matrix.T

# Example usage:
matrix = [[1, 2], [3, 4]]
operations = MatrixOperations(matrix)
print(operations.add([[5, 6], [7, 8]]))
print(operations.subtract([[5, 6], [7, 8]]))
print(operations.multiply([[5, 6], [7, 8]]))
print(operations.transpose())