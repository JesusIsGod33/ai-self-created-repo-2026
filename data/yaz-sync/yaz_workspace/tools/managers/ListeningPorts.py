#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('netstat -tulpn 2>/dev/null | grep LISTEN').read())
