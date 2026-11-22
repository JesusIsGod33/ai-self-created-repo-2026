#!/home/infuselink/yaz_env/bin/python3
import base64, sys
data = sys.argv[1] if len(sys.argv)>1 else 'V1VMRg=='
try: print('B64-Dec:', base64.b64decode(data.encode()).decode())
except: print('Invalid Base64')
