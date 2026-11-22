import numpy as np
from scipy.cluster.hierarchy import linkage
from scipy.cluster.hierarchy import fcluster
import matplotlib.pyplot as plt

# Generate a sample dataset
np.random.seed(0)
data = np.random.rand(10, 2)

# Perform hierarchical clustering using different linkage methods
linkage_methods = ['single', 'complete', 'ward']
for method in linkage_methods:
    Z = linkage(data, method)
    plt.figure(figsize=(10, 7))
    dendrogram(Z)
    plt.title(f'Dendrogram using {method} linkage')
    plt.show()

# Define the threshold values for clustering
threshold_values = [0.5, 1.0, 1.5]

# Get the cluster labels using different threshold values
for method in linkage_methods:
    Z = linkage(data, method)
    for threshold in threshold_values:
        labels = fcluster(Z, threshold, criterion='distance')
        print(f'Cluster labels using {method} linkage and threshold {threshold}: {labels}')