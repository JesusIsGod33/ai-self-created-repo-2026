from Yaz_master import BaseManager

class DetectorManager(BaseManager):
    def __init__(self):
        super().__init__()
        self.scan_interval = 5  # seconds

    def execute(self):
        print("DetectorManager is executing...")
        # Implement detection logic here

    def configure(self, **kwargs):
        if "scan_interval" in kwargs:
            self.scan_interval = kwargs["scan_interval"]