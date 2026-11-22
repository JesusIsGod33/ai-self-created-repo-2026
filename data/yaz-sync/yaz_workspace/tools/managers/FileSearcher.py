#!/home/infuselink/yaz_env/bin/python3
import os, sys
pattern = sys.argv[1] if len(sys.argv)>1 else '.py'
path = os.path.expanduser('~/yaz_workspace')
res = []
for r, d, f in os.walk(path):
 for file in f:
  if pattern in file: res.append(os.path.join(r, file))
print(f'Found {len(res)} files matching "{pattern}". Top 5:')
for x in res[:5]: print(x)
