#!/home/infuselink/yaz_env/bin/python3
import sys
data = sys.argv[1] if len(sys.argv)>1 else 'YAZ'
print(data.encode().hex())
