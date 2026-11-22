#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('cat /proc/loadavg').read() if os.path.exists('/proc/loadavg') else 'Load Avg Unavailable')
