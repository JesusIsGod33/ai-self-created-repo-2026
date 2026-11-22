#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('mount | column -t | head -n 10').read())
