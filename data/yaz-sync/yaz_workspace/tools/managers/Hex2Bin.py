#!/home/infuselink/yaz_env/bin/python3
import sys
data = sys.argv[1] if len(sys.argv)>1 else '2a'
try: print(bin(int(data, 16)))
except Exception as e: print(e)
