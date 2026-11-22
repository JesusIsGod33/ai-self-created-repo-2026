import random

def generate_mac():
    mac = [random.randint(0, 255) for _ in range(6)]
    return ':'.join(f'{part:02x}' for part in mac)

print(generate_mac())