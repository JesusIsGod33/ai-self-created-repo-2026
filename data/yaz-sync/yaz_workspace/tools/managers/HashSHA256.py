#!/home/infuselink/yaz_env/bin/python3
import hashlib, sys
data = sys.argv[1] if len(sys.argv)>1 else 'YAZ'
print('SHA256:', hashlib.sha256(data.encode()).hexdigest())
