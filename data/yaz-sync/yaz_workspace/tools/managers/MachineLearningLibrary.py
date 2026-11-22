# Import necessary libraries
import numpy as np
from typing import List, Dict

# Define a class for linear regression
class LinearRegression:
    def __init__(self, learning_rate: float = 0.001, num_iterations: int = 1000):
        """
        Initialize the linear regression model.

        Args:
        - learning_rate (float): The learning rate for gradient descent. Defaults to 0.001.
        - num_iterations (int): The number of iterations for gradient descent. Defaults to 1000.
        """
        self.learning_rate = learning_rate
        self.num_iterations = num_iterations
        self.weights = None
        self.bias = None

    def fit(self, X: np.ndarray, y: np.ndarray):
        """
        Train the linear regression model.

        Args:
        - X (np.ndarray): The feature matrix.
        - y (np.ndarray): The target vector.
        """
        num_samples, num_features = X.shape
        self.weights = np.zeros(num_features)
        self.bias = 0

        for _ in range(self.num_iterations):
            y_predicted = np.dot(X, self.weights) + self.bias
            dw = (1 / num_samples) * np.dot(X.T, (y_predicted - y))
            db = (1 / num_samples) * np.sum(y_predicted - y)

            self.weights -= self.learning_rate * dw
            self.bias -= self.learning_rate * db

    def predict(self, X: np.ndarray):
        """
        Make predictions using the trained linear regression model.

        Args:
        - X (np.ndarray): The feature matrix.

        Returns:
        - np.ndarray: The predicted target values.
        """
        y_approximated = np.dot(X, self.weights) + self.bias
        return y_approximated


# Define a class for decision trees
class DecisionTree:
    def __init__(self, max_depth: int = 5):
        """
        Initialize the decision tree model.

        Args:
        - max_depth (int): The maximum depth of the decision tree. Defaults to 5.
        """
        self.max_depth = max_depth
        self.tree = {}

    def fit(self, X: np.ndarray, y: np.ndarray):
        """
        Train the decision tree model.

        Args:
        - X (np.ndarray): The feature matrix.
        - y (np.ndarray): The target vector.
        """
        self.tree = self._build_tree(X, y)

    def _build_tree(self, X: np.ndarray, y: np.ndarray, depth: int = 0):
        """
        Recursively build the decision tree.

        Args:
        - X (np.ndarray): The feature matrix.
        - y (np.ndarray): The target vector.
        - depth (int): The current depth of the tree.

        Returns:
        - dict: The decision tree.
        """
        if len(np.unique(y)) == 1:
            return np.unique(y)[0]

        if depth >= self.max_depth:
            return np.mean(y)

        num_samples, num_features = X.shape
        best_feature = np.random.choice(num_features)
        best_threshold = np.random.choice(X[:, best_feature])

        left_indices = X[:, best_feature] < best_threshold
        right_indices = X[:, best_feature] >= best_threshold

        left = self._build_tree(X[left_indices], y[left_indices], depth + 1)
        right = self._build_tree(X[right_indices], y[right_indices], depth + 1)

        return {"feature": best_feature, "threshold": best_threshold, "left": left, "right": right}

    def predict(self, X: np.ndarray):
        """
        Make predictions using the trained decision tree model.

        Args:
        - X (np.ndarray): The feature matrix.

        Returns:
        - np.ndarray: The predicted target values.
        """
        predictions = [self._predict(inputs) for inputs in X]
        return np.array(predictions)

    def _predict(self, inputs: np.ndarray):
        """
        Recursively make predictions using the decision tree.

        Args:
        - inputs (np.ndarray): The input features.

        Returns:
        - float: The predicted target value.
        """
        node = self.tree

        while isinstance(node, dict):
            feature = node["feature"]
            threshold = node["threshold"]

            if inputs[feature] < threshold:
                node = node["left"]
            else:
                node = node["right"]

        return node


# Define a class for k-nearest neighbors
class KNearestNeighbors:
    def __init__(self, k: int = 5):
        """
        Initialize the k-nearest neighbors model.

        Args:
        - k (int): The number of nearest neighbors to consider. Defaults to 5.
        """
        self.k = k
        self.X_train = None
        self.y_train = None

    def fit(self, X: np.ndarray, y: np.ndarray):
        """
        Train the k-nearest neighbors model.

        Args:
        - X (np.ndarray): The feature matrix.
        - y (np.ndarray): The target vector.
        """
        self.X_train = X
        self.y_train = y

    def predict(self, X: np.ndarray):
        """
        Make predictions using the trained k-nearest neighbors model.

        Args:
        - X (np.ndarray): The feature matrix.

        Returns:
        - np.ndarray: The predicted target values.
        """
        predictions = [self._predict(inputs) for inputs in X]
        return np.array(predictions)

    def _predict(self, inputs: np.ndarray):
        """
        Make predictions using the k-nearest neighbors algorithm.

        Args:
        - inputs (np.ndarray): The input features.

        Returns:
        - float: The predicted target value.
        """
        distances = np.linalg.norm(self.X_train - inputs, axis=1)
        k_indices = np.argsort(distances)[:self.k]
        k_nearest_labels = [self.y_train[i] for i in k_indices]
        most_common = max(set(k_nearest_labels), key=k_nearest_labels.count)
        return most_common


# Example usage
if __name__ == "__main__":
    # Generate some random data
    np.random.seed(0)
    X = np.random.rand(100, 5)
    y = np.random.rand(100)

    # Train and test a linear regression model
    model = LinearRegression()
    model.fit(X, y)
    predictions = model.predict(X)
    print("Linear Regression Predictions:", predictions)

    # Train and test a decision tree model
    model = DecisionTree()
    model.fit(X, y)
    predictions = model.predict(X)
    print("Decision Tree Predictions:", predictions)

    # Train and test a k-nearest neighbors model
    model = KNearestNeighbors()
    model.fit(X, y)
    predictions = model.predict(X)
    print("K-Nearest Neighbors Predictions:", predictions)