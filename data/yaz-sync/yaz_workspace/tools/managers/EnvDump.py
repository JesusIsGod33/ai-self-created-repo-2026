#!/home/infuselink/yaz_env/bin/python3
import os; [print(f'{k}={v}') for k,v in os.environ.items() if 'KEY' not in k]
