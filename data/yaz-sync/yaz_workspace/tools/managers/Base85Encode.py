#!/home/infuselink/yaz_env/bin/python3
import base64, sys
data = sys.argv[1] if len(sys.argv)>1 else 'YAZ'
print('B85-Enc:', base64.b85encode(data.encode()).decode())
