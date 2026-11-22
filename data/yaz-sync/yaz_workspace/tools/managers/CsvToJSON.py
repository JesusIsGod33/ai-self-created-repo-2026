#!/home/infuselink/yaz_env/bin/python3
import json, csv, sys, io
data = sys.argv[1] if len(sys.argv)>1 else 'name,age\nYaz,1\n'
reader = csv.DictReader(io.StringIO(data))
print(json.dumps(list(reader), indent=2))
