import subprocess

def search_packages(package_name):
    try:
        output = subprocess.check_output(["apt", "search", package_name])
        print(output.decode("utf-8"))
    except subprocess.CalledProcessError as e:
        print(f"Error searching for package {package_name}: {e}")

search_packages("linux-modules-extra")