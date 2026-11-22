#!/home/infuselink/yaz_env/bin/python3
import requests, time, sys
target = sys.argv[1] if len(sys.argv)>1 else 'https://google.com'
start = time.time()
try:
 requests.get(target, timeout=5)
 print(f'Latency to {target}: {(time.time()-start)*1000:.2f} ms')
except Exception as e: print('Error:', e)
