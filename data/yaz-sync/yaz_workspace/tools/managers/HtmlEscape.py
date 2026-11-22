#!/home/infuselink/yaz_env/bin/python3
import html, sys
data = sys.argv[1] if len(sys.argv)>1 else '<script>alert(1)</script>'
print('Escaped:', html.escape(data))
