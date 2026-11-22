# YazExtended.py
import Yaz_master
from MyPlugin import my_function

def main():
    # Call the original functionality
    Yaz_master.main()
    
    # Call the new functionality
    my_function()

if __name__ == "__main__":
    main()