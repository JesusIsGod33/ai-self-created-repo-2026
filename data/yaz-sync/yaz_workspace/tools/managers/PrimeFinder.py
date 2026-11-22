#!/home/infuselink/yaz_env/bin/python3
import sys
lim = int(sys.argv[1]) if len(sys.argv)>1 else 50
primes = [x for x in range(2, lim) if all(x % y != 0 for y in range(2, int(x**0.5)+1))]
print(f'Primes up to {lim}:', primes)
