#!/home/infuselink/yaz_env/bin/python3
import sys
n = int(sys.argv[1]) if len(sys.argv)>1 else 10
a,b=0,1
res=[]
for _ in range(n): res.append(a); a,b=b,a+b
print(f'Fibonacci({n}):', res)
