#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('df -h /').read() if os.name == 'posix' else 'Disk Info Unavailable')
