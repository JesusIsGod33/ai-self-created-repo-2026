#!/home/infuselink/yaz_env/bin/python3
import urllib.parse, sys
data = sys.argv[1] if len(sys.argv)>1 else 'https://yaz.ai/?q=test'
print('URL-Enc:', urllib.parse.quote_plus(data))
