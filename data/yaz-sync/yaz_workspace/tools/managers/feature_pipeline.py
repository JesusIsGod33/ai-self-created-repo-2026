import time
import requests
import pandas as pd

def fetch_history(symbol="BTC-USD", limit=50):
    """
    Queries Coinbase's spot price feed sequentially.
    """
    prices = []
    timestamps = []
    url = f"https://api.coinbase.com/v2/prices/{symbol}/spot"
    
    for _ in range(limit):
        try:
            r = requests.get(url, timeout=5)
            if r.status_code == 200:
                prices.append(float(r.json()["data"]["amount"]))
                timestamps.append(pd.Timestamp.now())
            time.sleep(0.1)  # Limit query speed to avoid rate-limiting
        except Exception:
            pass
            
    df = pd.DataFrame({"price": prices}, index=timestamps)
    return df

def generate_features(df, short_window=3, long_window=10):
    if len(df) < long_window:
        return df
        
    df["sma_short"] = df["price"].rolling(window=short_window).mean()
    df["sma_long"] = df["price"].rolling(window=long_window).mean()
    df["momentum"] = df["price"].pct_change(periods=short_window)
    df["volatility"] = df["price"].rolling(window=short_window).std()
    
    # Binary target (1 if price increases next period, 0 otherwise)
    df["target"] = (df["price"].shift(-1) > df["price"]).astype(int)
    return df.dropna()

if __name__ == "__main__":
    print("[TEST] Fetching sample ticks...")
    df_raw = fetch_history(limit=15)
    df_feat = generate_features(df_raw)
    print(df_feat.head(5))
