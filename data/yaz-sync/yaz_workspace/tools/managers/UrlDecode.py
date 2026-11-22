#!/home/infuselink/yaz_env/bin/python3
import urllib.parse, sys
data = sys.argv[1] if len(sys.argv)>1 else 'https%3A%2F%2Fyaz.ai%2F%3Fq%3Dtest'
print('URL-Dec:', urllib.parse.unquote_plus(data))
