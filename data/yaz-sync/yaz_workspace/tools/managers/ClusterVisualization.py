import numpy as np
from scipy.cluster.hierarchy import linkage
from scipy.cluster.hierarchy import fcluster
import matplotlib.pyplot as plt

# Generate a sample dataset
np.random.seed(0)
data = np.random.rand(10, 2)

# Perform hierarchical clustering
Z = linkage(data, 'ward')

# Define the threshold for clustering
threshold = 1.0

# Get the cluster labels
labels = fcluster(Z, threshold, criterion='distance')

# Plot the clusters using different colors
plt.figure(figsize=(10, 7))
for i in range(len(data)):
    if labels[i] == 1:
        plt.scatter(data[i, 0], data[i, 1], c='red')
    elif labels[i] == 2:
        plt.scatter(data[i, 0], data[i, 1], c='blue')
    elif labels[i] == 3:
        plt.scatter(data[i, 0], data[i, 1], c='green')
plt.show()