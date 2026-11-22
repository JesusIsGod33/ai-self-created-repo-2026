class AutoApplierManager:
    def __init__(self):
        pass

    def apply(self, rule):
        # Apply the given rule
        print(f"Applying rule: {rule}")

# Example usage:
if __name__ == "__main__":
    auto_applier = AutoApplierManager()
    auto_applier.apply("CRITICAL AUTO-APPLIER RULE")