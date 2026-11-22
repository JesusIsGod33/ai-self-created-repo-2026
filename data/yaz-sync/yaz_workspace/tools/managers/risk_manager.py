def calculate_position_size(capital, volatility, max_risk_pct=0.02):
    """
    Sizes orders inversely proportional to rolling market volatility to limit drawdown.
    """
    risk_capital = capital * max_risk_pct
    if volatility is None or volatility <= 0:
        return 0.0
        
    # Standard deviation inversely-weighted position sizing
    target_allocation = risk_capital / volatility
    return min(target_allocation, capital)
