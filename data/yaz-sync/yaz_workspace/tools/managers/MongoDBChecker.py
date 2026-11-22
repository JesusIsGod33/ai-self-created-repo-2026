import subprocess

def check_mongodb():
    try:
        subprocess.run(['mongo', '--version'], check=True)
        print("MongoDB is installed and running.")
    except FileNotFoundError:
        print("MongoDB is not installed.")
    except subprocess.CalledProcessError:
        print("MongoDB is not running.")

if __name__ == "__main__":
    check_mongodb()