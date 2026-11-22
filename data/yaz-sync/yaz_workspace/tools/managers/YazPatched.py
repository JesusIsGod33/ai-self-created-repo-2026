# YazPatched.py
from Yaz_master import main
from MyDecorator import my_decorator

@my_decorator
def patched_main():
    main()

if __name__ == "__main__":
    patched_main()