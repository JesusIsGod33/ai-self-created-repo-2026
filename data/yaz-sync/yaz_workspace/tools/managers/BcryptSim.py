#!/home/infuselink/yaz_env/bin/python3
import hashlib, sys
data = sys.argv[1] if len(sys.argv)>1 else 'YAZ'
print('PBKDF2-HMAC-SHA256 (Simulating Key Derivation):', hashlib.pbkdf2_hmac('sha256', data.encode(), b'salt', 100000).hex())
