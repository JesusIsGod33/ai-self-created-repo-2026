#!/home/infuselink/yaz_env/bin/python3
import sys
data = sys.argv[1] if len(sys.argv)>1 else '59415a'
try: print(bytes.fromhex(data).decode())
except Exception as e: print(e)
