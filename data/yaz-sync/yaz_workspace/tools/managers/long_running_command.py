import time

def run_long_running_command():
    print("Starting long-running command...")
    # Simulate a long-running command
    time.sleep(5)
    print("Long-running command completed.")

if __name__ == "__main__":
    run_long_running_command()