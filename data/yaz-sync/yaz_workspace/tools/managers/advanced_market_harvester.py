import os
import time
import requests
import json
import logging
import threading
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Setup logging
log_dir = os.path.expanduser("~/yaz_workspace/logs")
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    filename=os.path.join(log_dir, "market_harvester.log"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

class MarketHarvester:
    def __init__(self):
        self.targets = ["BTC", "ETH", "LTC"]
        self.history = {t: [] for t in self.targets}
        self.lock = threading.Lock()

    def fetch_coinbase(self, symbol):
        try:
            r = requests.get(f"https://api.coinbase.com/v2/prices/{symbol}-USD/spot", timeout=5)
            r.raise_for_status()
            return float(r.json()["data"]["amount"])
        except Exception as e:
            logging.error(f"Coinbase fetch error for {symbol}: {e}")
            return None

    def fetch_gemini(self, symbol):
        try:
            r = requests.get(f"https://api.gemini.com/v1/pubticker/{symbol.lower()}usd", timeout=5)
            r.raise_for_status()
            return float(r.json()["last"])
        except Exception as e:
            logging.error(f"Gemini fetch error for {symbol}: {e}")
            return None

    def fetch_kraken(self, symbol):
        try:
            # Map standard symbols to Kraken pairs
            pair_map = {"BTC": "XBTUSD", "ETH": "ETHUSD", "LTC": "LTCUSD"}
            pair = pair_map.get(symbol, f"{symbol}USD")
            r = requests.get(f"https://api.kraken.com/0/public/Ticker?pair={pair}", timeout=5)
            r.raise_for_status()
            res = r.json()
            # Kraken returns values under standard exchange array maps
            key = list(res["result"].keys())[0]
            return float(res["result"][key]["c"][0])
        except Exception as e:
            logging.error(f"Kraken fetch error for {symbol}: {e}")
            return None

    def harvest_symbol(self, symbol):
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = {
                executor.submit(self.fetch_coinbase, symbol): "Coinbase",
                executor.submit(self.fetch_gemini, symbol): "Gemini",
                executor.submit(self.fetch_kraken, symbol): "Kraken"
            }
            prices = {}
            for fut in as_completed(futures):
                exchange = futures[fut]
                val = fut.result()
                if val:
                    prices[exchange] = val

        if len(prices) < 2:
            return

        p_list = list(prices.values())
        min_p = min(p_list)
        max_p = max(p_list)
        spread = max_p - min_p
        pct_spread = (spread / min_p) * 100

        # Update rolling statistical history safely
        with self.lock:
            self.history[symbol].append(pct_spread)
            if len(self.history[symbol]) > 100:
                self.history[symbol].pop(0)
            
            # Calculate rolling average spread
            rolling_avg = sum(self.history[symbol]) / len(self.history[symbol])

        # Write log record
        log_msg = (
            f"[{symbol}] Spot Rates -> "
            f"Coinbase: ${prices.get('Coinbase', 0.0):.2f} | "
            f"Gemini: ${prices.get('Gemini', 0.0):.2f} | "
            f"Kraken: ${prices.get('Kraken', 0.0):.2f} | "
            f"Spread: ${spread:.2f} ({pct_spread:.4f}%) | "
            f"10-Period Avg: {rolling_avg:.4f}%"
        )
        print(log_msg)
        logging.info(log_msg)

        # Log arbitrage opportunities
        if pct_spread > 0.05:
            op_file = os.path.expanduser("~/yaz_workspace/arbitrage_opportunities.txt")
            with open(op_file, "a") as f:
                f.write(f"{datetime.now().isoformat()},{symbol},{json.dumps(prices)},{pct_spread:.4f}\n")

    def run(self):
        print(f"--- Quantitative Arbitrage Harvester Active {datetime.now()} ---")
        while True:
            for symbol in self.targets:
                self.harvest_symbol(symbol)
                time.sleep(1)
            time.sleep(10)

if __name__ == "__main__":
    harvester = MarketHarvester()
    harvester.run()
