#!/home/infuselink/yaz_env/bin/python3
import base64, sys
data = sys.argv[1] if len(sys.argv)>1 else 'YAZ'
print('B64-Enc:', base64.b64encode(data.encode()).decode())
