#!/home/infuselink/yaz_env/bin/python3
import sys
data = sys.argv[1] if len(sys.argv)>1 else '101010'
try: print(hex(int(data, 2)))
except Exception as e: print(e)
