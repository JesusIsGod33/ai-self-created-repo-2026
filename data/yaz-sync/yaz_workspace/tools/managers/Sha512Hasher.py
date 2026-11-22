#!/home/infuselink/yaz_env/bin/python3
import hashlib, sys
data = sys.argv[1] if len(sys.argv)>1 else 'YAZ'
print('SHA512:', hashlib.sha512(data.encode()).hexdigest())
