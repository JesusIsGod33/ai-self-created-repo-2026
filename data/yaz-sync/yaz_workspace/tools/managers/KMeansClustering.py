import numpy as np
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt

# Generate a sample dataset
np.random.seed(0)
data = np.random.rand(100, 2)

# Perform K-means clustering
kmeans = KMeans(n_clusters=5)
kmeans.fit(data)

# Get the cluster labels
labels = kmeans.labels_

# Get the cluster centers
centers = kmeans.cluster_centers_

# Plot the data points and cluster centers
plt.scatter(data[:, 0], data[:, 1], c=labels)
plt.scatter(centers[:, 0], centers[:, 1], c='red', marker='x', s=200)
plt.show()