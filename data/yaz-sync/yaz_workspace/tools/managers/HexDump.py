#!/home/infuselink/yaz_env/bin/python3
import sys
data = sys.argv[1] if len(sys.argv)>1 else 'YAZ OS'
print(' '.join(f'{ord(c):02x}' for c in data))
