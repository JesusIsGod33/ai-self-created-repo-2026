#!/home/infuselink/yaz_env/bin/python3
import base64, json, sys
token = sys.argv[1] if len(sys.argv)>1 else 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.sig'
try:
 payload = token.split('.')[1]
 padded = payload + '=' * (-len(payload) % 4)
 print('JWT Payload:', base64.urlsafe_b64decode(padded).decode())
except Exception as e: print('JWT Decode Failed:', e)
