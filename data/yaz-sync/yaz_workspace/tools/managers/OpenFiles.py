#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('lsof -i -P -n | head -n 10 2>/dev/null || echo "lsof missing"').read())
