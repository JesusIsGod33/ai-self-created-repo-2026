#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('ps axo stat,ppid,pid,comm | grep -w defunc').read() or 'No Zombies Found')
