#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('ss -tuln').read() if os.name == 'posix' else 'netstat')
