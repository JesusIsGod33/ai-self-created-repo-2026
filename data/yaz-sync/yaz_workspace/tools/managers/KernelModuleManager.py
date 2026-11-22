import os
import subprocess

class KernelModuleManager:
    def __init__(self):
        self.kernel_version = subprocess.check_output(['uname', '-r']).decode('utf-8').strip()

    def load_module(self, module_name):
        subprocess.run(['sudo', 'modprobe', module_name])

    def unload_module(self, module_name):
        subprocess.run(['sudo', 'modprobe', '-r', module_name])

    def get_loaded_modules(self):
        loaded_modules = subprocess.check_output(['lsmod']).decode('utf-8').splitlines()
        return [module.split()[0] for module in loaded_modules[1:]]

# Example usage:
manager = KernelModuleManager()
print(manager.kernel_version)
manager.load_module('loop')
print(manager.get_loaded_modules())