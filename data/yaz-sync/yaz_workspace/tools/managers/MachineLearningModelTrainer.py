import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression

class MachineLearningModelTrainer:
    def __init__(self):
        self.model = None

    def train_model(self, X, y):
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        self.model = LinearRegression()
        self.model.fit(X_train, y_train)
        print("Model trained")

    def test_model(self, X):
        if self.model is not None:
            predictions = self.model.predict(X)
            print("Model tested")
            return predictions
        else:
            print("Model not trained")
            return None

# Create an instance of the MachineLearningModelTrainer
trainer = MachineLearningModelTrainer()

# Train the model with some data
X = np.array([[1, 2], [3, 4], [5, 6]])
y = np.array([2, 4, 5])
trainer.train_model(X, y)

# Test the model with some new data
X_new = np.array([[7, 8]])
predictions = trainer.test_model(X_new)
print(predictions)