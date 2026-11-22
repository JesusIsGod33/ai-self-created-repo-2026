#!/home/infuselink/yaz_env/bin/python3
import re, sys
pattern = sys.argv[1] if len(sys.argv)>1 else '^[a-z]+$'
string = sys.argv[2] if len(sys.argv)>2 else 'test'
print('Match:', bool(re.match(pattern, string)))
