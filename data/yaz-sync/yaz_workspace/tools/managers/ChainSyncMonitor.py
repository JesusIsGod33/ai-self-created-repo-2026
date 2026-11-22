import time
import requests
from datetime import datetime

class ChainSyncMonitor:
    def __init__(self, blockchain_url, sync_interval):
        self.blockchain_url = blockchain_url
        self.sync_interval = sync_interval

    def get_block_height(self):
        try:
            response = requests.get(self.blockchain_url + '/block_height')
            response.raise_for_status()
            return response.json()['block_height']
        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            return None
        except ValueError as e:
            print(f"JSON parsing error: {e}")
            return None

    def get_sync_status(self):
        try:
            response = requests.get(self.blockchain_url + '/sync_status')
            response.raise_for_status()
            return response.json()['sync_status']
        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            return None
        except ValueError as e:
            print(f"JSON parsing error: {e}")
            return None

    def monitor_chain_sync(self):
        while True:
            block_height = self.get_block_height()
            sync_status = self.get_sync_status()
            print(f'Block Height: {block_height}, Sync Status: {sync_status}, Timestamp: {datetime.now()}')
            time.sleep(self.sync_interval)

# Example usage:
blockchain_url = 'https://example.com/blockchain'
sync_interval = 60  # seconds
monitor = ChainSyncMonitor(blockchain_url, sync_interval)
monitor.monitor_chain_sync()