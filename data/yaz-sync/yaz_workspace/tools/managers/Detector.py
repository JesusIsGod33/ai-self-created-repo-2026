import time
import subprocess

class Detector:
    def __init__(self):
        self.scan_interval = 5  # seconds

    def scan(self):
        # Implement your scanning logic here
        # For demonstration purposes, we'll just print a message
        print("Scanning...")

    def run_detection_loop(self):
        while True:
            self.scan()
            time.sleep(self.scan_interval)

    def main(self):
        print("Main detection loop started.")
        self.run_detection_loop()

if __name__ == "__main__":
    detector = Detector()
    detector.main()