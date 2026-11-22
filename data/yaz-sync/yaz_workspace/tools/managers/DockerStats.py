#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null').read())
