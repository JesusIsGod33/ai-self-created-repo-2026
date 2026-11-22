#!/home/infuselink/yaz_env/bin/python3
import os, sys
pid = sys.argv[1] if len(sys.argv)>1 else '0'
print(os.popen(f'kill -9 {pid} 2>&1 || echo "Cannot kill {pid}"').read())
