#!/home/infuselink/yaz_env/bin/python3
import socket, sys
target = sys.argv[1] if len(sys.argv)>1 else 'google.com'
try: print(f'{target} -> {socket.gethostbyname(target)}')
except Exception as e: print(f'DNS Failed: {e}')
