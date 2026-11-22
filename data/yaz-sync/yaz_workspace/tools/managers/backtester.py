import numpy as np

def run_backtest(prices, signals, initial_capital=10000.0, fee_rate=0.001):
    capital = initial_capital
    position = 0.0
    equity_curve = []
    
    for i in range(len(prices)):
        price = prices[i]
        signal = signals[i]
        
        # Buy trigger (1) while flat
        if signal == 1 and position == 0.0:
            fee = capital * fee_rate
            position = (capital - fee) / price
            capital = 0.0
            
        # Sell trigger (0) while holding
        elif signal == 0 and position > 0.0:
            gross_cash = position * price
            fee = gross_cash * fee_rate
            capital = gross_cash - fee
            position = 0.0
            
        current_equity = capital + (position * price)
        equity_curve.append(current_equity)
        
    equity_arr = np.array(equity_curve)
    total_return = (equity_curve[-1] - initial_capital) / initial_capital
    
    # Compute peak drawdowns
    peaks = np.maximum.accumulate(equity_arr)
    drawdowns = (peaks - equity_arr) / peaks
    max_drawdown = drawdowns.max() if len(drawdowns) > 0 else 0.0
    
    return equity_curve, total_return, max_drawdown
