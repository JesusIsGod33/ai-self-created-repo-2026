def generate_config():
    config = {
        'scan_interval': 5,
        'scan_depth': 100,
        'scan_resolution': 0.1
    }
    return config

if __name__ == "__main__":
    config = generate_config()
    print(config)