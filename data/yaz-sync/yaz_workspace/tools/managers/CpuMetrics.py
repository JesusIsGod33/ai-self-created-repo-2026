#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('cat /proc/cpuinfo | grep "model name" | head -n 1').read() if os.path.exists('/proc/cpuinfo') else 'CPU Info Unavailable')
