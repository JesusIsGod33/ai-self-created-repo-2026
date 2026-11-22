#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('systemctl list-units --type=service --state=running | head -n 10').read())
