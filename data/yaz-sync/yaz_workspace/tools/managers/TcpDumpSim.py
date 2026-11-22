#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('tcpdump -c 5 -i any 2>/dev/null || echo "Sudo required or tcpdump missing"').read())
