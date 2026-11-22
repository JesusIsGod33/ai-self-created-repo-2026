import subprocess
import sys

def auto_upgrader():
    # Update package list
    subprocess.run(['sudo', 'apt', 'update'])
    
    # Upgrade all installed packages
    subprocess.run(['sudo', 'apt', 'full-upgrade', '-y'])
    
    # Remove unnecessary packages
    subprocess.run(['sudo', 'apt', 'autoremove', '-y'])
    
    # Clean up package cache
    subprocess.run(['sudo', 'apt', 'autoclean', '-y'])
    
    # Reinstall pip
    subprocess.run(['sudo', 'apt', 'install', '--reinstall', 'python3-pip', '-y'])
    
    # Verify Python version
    subprocess.run(['python3', '--version'])

if __name__ == "__main__":
    auto_upgrader()