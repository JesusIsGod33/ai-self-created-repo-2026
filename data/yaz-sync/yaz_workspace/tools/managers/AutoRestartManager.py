import json

class AutoRestartManager:
    def __init__(self, config):
        self.config = config

    def get_auto_restart_status(self):
        return self.config.get('auto_restart', False)

    def set_auto_restart_status(self, status):
        self.config['auto_restart'] = status

# Example usage:
config = {'auto_restart': True}
mgr = AutoRestartManager(config)
print(mgr.get_auto_restart_status())  # Output: True
mgr.set_auto_restart_status(False)
print(mgr.get_auto_restart_status())  # Output: False