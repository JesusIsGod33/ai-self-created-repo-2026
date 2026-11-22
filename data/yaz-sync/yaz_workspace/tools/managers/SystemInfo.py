import os
import sys

# Print system information
print("System Information:")
print("--------------------")
print("Operating System:", sys.platform)
print("System Version:", sys.version)
print("Current Working Directory:", os.getcwd())
print("System Files and Directories:", os.listdir('/sys'))