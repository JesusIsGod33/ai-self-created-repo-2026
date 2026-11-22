#!/home/infuselink/yaz_env/bin/python3
import math, sys
n = int(sys.argv[1]) if len(sys.argv)>1 else 10
print(f'{n}! =', math.factorial(n))
