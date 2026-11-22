import json

class ServerlessCostEstimator:
    def __init__(self, cloud_provider, function_name, memory_size, execution_time):
        self.cloud_provider = cloud_provider
        self.function_name = function_name
        self.memory_size = memory_size
        self.execution_time = execution_time

    def estimate_cost(self):
        # Estimate cost based on cloud provider, function name, memory size, and execution time
        if self.cloud_provider == 'AWS':
            cost = self.memory_size * self.execution_time * 0.000004
        elif self.cloud_provider == 'Azure':
            cost = self.memory_size * self.execution_time * 0.000005
        elif self.cloud_provider == 'Google Cloud':
            cost = self.memory_size * self.execution_time * 0.000006
        else:
            raise ValueError('Unsupported cloud provider')

        return cost

# Example usage:
estimator = ServerlessCostEstimator('AWS', 'my_function', 128, 100)
print(estimator.estimate_cost())