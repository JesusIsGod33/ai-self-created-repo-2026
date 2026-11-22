import json

class ScannerConfigurator:
    def __init__(self):
        self.config = {
            "scan_interval": 10,  # seconds
            "scan_depth": 100,  # meters
            "scan_resolution": 0.1  # meters
        }

    def save_config(self, file_path):
        with open(file_path, "w") as f:
            json.dump(self.config, f)

    def load_config(self, file_path):
        with open(file_path, "r") as f:
            self.config = json.load(f)

    def update_config(self, **kwargs):
        for key, value in kwargs.items():
            if key in self.config:
                self.config[key] = value
            else:
                print(f"Invalid config key: {key}")

# Create an instance of the ScannerConfigurator class
configurator = ScannerConfigurator()

# Update the scan interval to 5 seconds
configurator.update_config(scan_interval=5)

# Save the config to a file
configurator.save_config("scanner_config.json")

# Load the config from a file
configurator.load_config("scanner_config.json")

# Print the current config
print(configurator.config)