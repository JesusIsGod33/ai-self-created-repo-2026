#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('docker images 2>/dev/null || echo "Docker not running"').read())
