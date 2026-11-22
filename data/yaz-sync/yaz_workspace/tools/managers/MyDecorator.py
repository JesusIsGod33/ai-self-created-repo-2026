# MyDecorator.py
def my_decorator(func):
    def wrapper(*args, **kwargs):
        # Add new functionality before calling the original function
        print("Before calling the original function")
        
        # Call the original function
        result = func(*args, **kwargs)
        
        # Add new functionality after calling the original function
        print("After calling the original function")
        
        return result
    
    return wrapper