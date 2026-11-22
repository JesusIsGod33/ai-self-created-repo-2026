import subprocess

def load_kernel_modules():
    package_name = "linux-modules-extra"
    try:
        subprocess.run(["apt", "install", "-y", package_name], check=True)
        print(f"Package {package_name} installed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error installing package {package_name}: {e}")

load_kernel_modules()