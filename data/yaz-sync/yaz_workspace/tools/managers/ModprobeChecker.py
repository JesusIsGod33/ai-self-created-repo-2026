import subprocess
import sys

def check_modprobe():
    try:
        subprocess.run(['modprobe', '--version'], check=True)
        print("Modprobe is installed and available.")
    except FileNotFoundError:
        print("Modprobe is not installed or not available.")
        print("Please install modprobe by running 'sudo apt install kmod'")

if __name__ == '__main__':
    check_modprobe()