#!/home/infuselink/yaz_env/bin/python3
import os, sys
target = sys.argv[1] if len(sys.argv)>1 else '1.1.1.1'
print(os.popen(f'ping -c 1 -W 1 {target}').read())
