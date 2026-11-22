#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('cat ~/.ssh/config 2>/dev/null || echo "No SSH config found"').read())
