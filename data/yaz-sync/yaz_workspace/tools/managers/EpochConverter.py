#!/home/infuselink/yaz_env/bin/python3
import time, sys
try:
 if len(sys.argv)>1: print(time.ctime(int(sys.argv[1])))
 else: print('Current Epoch:', int(time.time()))
except: print('Invalid Epoch')
