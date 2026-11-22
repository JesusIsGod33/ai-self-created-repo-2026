#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('tail -n 20 /var/log/dpkg.log 2>/dev/null || echo "Requires Sudo or file missing"').read())
