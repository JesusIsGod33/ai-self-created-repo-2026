import os
import sys
from datetime import datetime

# Bind relative import directories
sys.path.append(os.path.expanduser("~/yaz_workspace/tools/managers"))

import feature_pipeline
import model_development
import backtester
import risk_manager

def execute_pipeline():
    print(f"[{datetime.now().isoformat()}] Querying public Coinbase REST feed...")
    df = feature_pipeline.fetch_history(symbol="BTC-USD", limit=30)
    df_parsed = feature_engineered = feature_pipeline.generate_features(df)
    
    if len(df_parsed) < 15:
        print("[ERROR] Insufficient tick density collected. Exiting execution loop.")
        return
        
    print(f"[PROCESS] Training RandomForest model over {len(df_parsed)} ticks...")
    model, scaler, acc = model_development.train_trading_model(df_parsed)
    
    if model is None:
        print("[ERROR] Model failed to train. Exiting.")
        return
        
    print(f"[METRIC] Out-of-sample Model Accuracy: {acc:.4f}")
    
    # Predict direction of next interval
    feature_cols = ["sma_short", "sma_long", "momentum", "volatility"]
    latest_features = df_parsed[feature_cols].iloc[-1:].values
    scaled_features = scaler.transform(latest_features)
    predicted_direction = model.predict(scaled_features)[0]
    
    # Apply Volatility Sizing
    current_volatility = df_parsed["volatility"].iloc[-1]
    capital = 10000.0  # Base simulated cash account
    allowed_size = risk_manager.calculate_position_size(capital, current_volatility)
    
    print(f"[DECISION] Predicted Next Price Movement: {'UP' if predicted_direction == 1 else 'DOWN'}")
    print(f"[DECISION] Current Volatility: {current_volatility:.4f} | Allowed Risk Capital: ${allowed_size:.2f}")

if __name__ == "__main__":
    execute_pipeline()
