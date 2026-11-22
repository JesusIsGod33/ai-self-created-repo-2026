#!/home/infuselink/yaz_env/bin/python3
import random, string, sys
length = int(sys.argv[1]) if len(sys.argv)>1 else 16
print('Password:', ''.join(random.choices(string.ascii_letters + string.digits + '!@#$%^&*', k=length)))
