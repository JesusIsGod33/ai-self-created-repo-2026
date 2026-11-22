import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

def train_trading_model(df):
    feature_cols = ["sma_short", "sma_long", "momentum", "volatility"]
    if len(df) < 10:
        return None, None, 0.0
        
    X = df[feature_cols]
    y = df["target"]
    
    # Sequential train/test split (80/20) to prevent time-series data leakage
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    # Robust scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Restrict max_depth to mitigate overfitting on market noise
    model = RandomForestClassifier(n_estimators=50, max_depth=3, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    acc = model.score(X_test_scaled, y_test)
    return model, scaler, acc
