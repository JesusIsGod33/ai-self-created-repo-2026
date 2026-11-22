# Import necessary libraries
import socket

# Define a class for the NetworkMonitor tool
class NetworkMonitor:
    def __init__(self):
        self.host = socket.gethostname()

    def get_host_info(self):
        return self.host

# Create an instance of the NetworkMonitor tool
monitor = NetworkMonitor()

# Print the host information
print(monitor.get_host_info())