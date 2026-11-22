import numpy as np
from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier

def tune_hyperparameters(X, y):
    # Define the hyperparameter search space
    param_grid = {
        'n_estimators': [10, 50, 100, 200],
        'max_depth': [None, 5, 10, 15],
        'min_samples_split': [2, 5, 10],
        'min_samples_leaf': [1, 5, 10]
    }

    # Initialize the model and grid search
    model = RandomForestClassifier()
    grid_search = GridSearchCV(model, param_grid, cv=5, scoring='accuracy')

    # Perform the grid search
    grid_search.fit(X, y)

    # Print the best hyperparameters and the corresponding accuracy
    print("Best hyperparameters:", grid_search.best_params_)
    print("Best accuracy:", grid_search.best_score_)

# Example usage
X = np.random.rand(100, 10)
y = np.random.randint(0, 2, 100)
tune_hyperparameters(X, y)