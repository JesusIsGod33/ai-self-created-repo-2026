#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('dmesg | tail -n 10 2>/dev/null || echo "dmesg requires sudo"').read())
