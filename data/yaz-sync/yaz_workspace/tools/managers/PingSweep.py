#!/home/infuselink/yaz_env/bin/python3
import os, sys
target = sys.argv[1] if len(sys.argv)>1 else '8.8.8.8'
print(os.popen(f'ping -c 3 {target}').read())
