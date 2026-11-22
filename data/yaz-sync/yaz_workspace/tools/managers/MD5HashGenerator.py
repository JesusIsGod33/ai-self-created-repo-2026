import hashlib
import sys

def generate_md5_hash(data):
    return hashlib.md5(data.encode()).hexdigest()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        data = sys.argv[1]
        print("MD5 Hash:", generate_md5_hash(data))
    else:
        print("Please provide data to generate MD5 hash.")