#!/home/infuselink/yaz_env/bin/python3
import urllib.request, sys
target = sys.argv[1] if len(sys.argv)>1 else 'http://google.com'
try:
 res = urllib.request.urlopen(target, timeout=5)
 for k,v in res.headers.items(): print(f'{k}: {v}')
except Exception as e: print(e)
