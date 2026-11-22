#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('tcpdump -i any -c 20 -n -s 0 "not port 22" 2>/dev/null || echo "Sudo required"').read())
