#!/home/infuselink/yaz_env/bin/python3
import sys, re
data = sys.argv[1] if len(sys.argv)>1 else 'some\x00binary\x00data\x00with\x00strings'
print('Strings:', re.findall(r'[ -~]{4,}', data))
