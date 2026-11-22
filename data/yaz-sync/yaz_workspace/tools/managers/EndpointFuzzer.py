#!/home/infuselink/yaz_env/bin/python3
import requests, sys
target = sys.argv[1] if len(sys.argv)>1 else 'http://localhost'
endpoints = ['/api','/admin','/login','/.git']
for ep in endpoints:
 try: print(f'{ep}: {requests.get(target+ep, timeout=2).status_code}')
 except: print(f'{ep}: Failed')
