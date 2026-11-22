#!/home/infuselink/yaz_env/bin/python3
import json, sys
data = sys.argv[1] if len(sys.argv)>1 else '{"valid": true}'
try:
 json.loads(data)
 print('Valid JSON')
except Exception as e: print('Invalid JSON:', e)
