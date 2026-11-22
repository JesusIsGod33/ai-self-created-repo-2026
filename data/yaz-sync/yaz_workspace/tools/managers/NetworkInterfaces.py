#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('ip addr show').read() if os.name == 'posix' else 'ifconfig')
