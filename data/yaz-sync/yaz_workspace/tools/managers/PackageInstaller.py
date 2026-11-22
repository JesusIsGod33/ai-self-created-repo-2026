import subprocess
import sys

def install_package(package_name):
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package_name])
        print(f"Package {package_name} installed successfully.")
    except Exception as e:
        print(f"Error installing package {package_name}: {e}")

def main():
    if len(sys.argv) > 1:
        package_name = sys.argv[1]
        install_package(package_name)
    else:
        print("Please provide the package name")

if __name__ == "__main__":
    main()