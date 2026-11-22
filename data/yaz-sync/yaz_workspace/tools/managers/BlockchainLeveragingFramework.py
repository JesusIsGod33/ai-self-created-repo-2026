import time
import requests
from datetime import datetime

class BlockchainLeveragingFramework:
    def __init__(self, blockchain_url, sync_interval, upgrade_interval):
        self.blockchain_url = blockchain_url
        self.sync_interval = sync_interval
        self.upgrade_interval = upgrade_interval
        self.chain_sync_monitor = ChainSyncMonitor(blockchain_url, sync_interval)
        self.mass_upgrades_monitor = MassUpgradesMonitor(blockchain_url, upgrade_interval)

    def monitor_chain_sync_and_upgrades(self):
        while True:
            self.chain_sync_monitor.monitor_chain_sync()
            self.mass_upgrades_monitor.monitor_mass_upgrades()
            time.sleep(60)  # seconds

# Example usage:
blockchain_url = 'https://example.com/blockchain'
sync_interval = 60  # seconds
upgrade_interval = 300  # seconds
framework = BlockchainLeveragingFramework(blockchain_url, sync_interval, upgrade_interval)
framework.monitor_chain_sync_and_upgrades()