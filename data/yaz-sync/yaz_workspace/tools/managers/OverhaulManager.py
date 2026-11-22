import time

class OverhaulManager:
    def __init__(self):
        self.start_time = time.time()

    def track_elapsed_time(self):
        end_time = time.time()
        elapsed_time = end_time - self.start_time
        return elapsed_time

    def overhaul(self):
        # overhaul process
        print("Overhaul in progress...")
        elapsed_time = self.track_elapsed_time()
        print(f"Overhaul completed. Elapsed time: {elapsed_time:.6f} seconds")

if __name__ == "__main__":
    overhaul_manager = OverhaulManager()
    overhaul_manager.overhaul()