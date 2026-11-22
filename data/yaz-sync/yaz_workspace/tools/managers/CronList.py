#!/home/infuselink/yaz_env/bin/python3
import os; print(os.popen('crontab -l 2>/dev/null || echo "No cron jobs"').read())
