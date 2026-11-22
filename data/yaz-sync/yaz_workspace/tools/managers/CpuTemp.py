#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null || echo "Temp sensor missing"').read())
