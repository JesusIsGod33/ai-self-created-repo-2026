#!/home/infuselink/yaz_env/bin/python3
import ssl, socket, sys
target = sys.argv[1] if len(sys.argv)>1 else 'google.com'
try:
 ctx = ssl.create_default_context()
 with ctx.wrap_socket(socket.socket(), server_hostname=target) as s:
  s.settimeout(3.0)
  s.connect((target, 443))
  cert = s.getpeercert()
  print(f'Issuer: {cert.get("issuer")[1][0][1]}')
  print(f'Expires: {cert.get("notAfter")}')
except Exception as e: print('SSL Check Failed:', e)
