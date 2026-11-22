import time
import requests
from datetime import datetime

class MassUpgradesMonitor:
    def __init__(self, blockchain_url, upgrade_interval):
        self.blockchain_url = blockchain_url
        self.upgrade_interval = upgrade_interval

    def get_upgrade_events(self):
        response = requests.get(self.blockchain_url + '/upgrade_events')
        return response.json()['upgrade_events']

    def analyze_upgrade_events(self, upgrade_events):
        # Analyze upgrade events and extract relevant metrics
        metrics = {}
        for event in upgrade_events:
            # Extract metrics such as upgrade type, block height, and timestamp
            metrics[event['upgrade_type']] = metrics.get(event['upgrade_type'], 0) + 1
        return metrics

    def monitor_mass_upgrades(self):
        while True:
            upgrade_events = self.get_upgrade_events()
            metrics = self.analyze_upgrade_events(upgrade_events)
            print(f'Upgrade Metrics: {metrics}, Timestamp: {datetime.now()}')
            time.sleep(self.upgrade_interval)

# Example usage:
blockchain_url = 'https://example.com/blockchain'
upgrade_interval = 300  # seconds
monitor = MassUpgradesMonitor(blockchain_url, upgrade_interval)
monitor.monitor_mass_upgrades()