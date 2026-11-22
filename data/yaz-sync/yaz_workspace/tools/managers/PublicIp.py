#!/home/infuselink/yaz_env/bin/python3
import urllib.request
try: print('Public IP:', urllib.request.urlopen('https://api.ipify.org', timeout=5).read().decode())
except Exception as e: print('IP Fetch Failed:', e)
