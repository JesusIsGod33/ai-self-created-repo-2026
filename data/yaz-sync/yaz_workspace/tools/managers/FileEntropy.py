#!/home/infuselink/yaz_env/bin/python3
import sys, math, collections
data = sys.argv[1] if len(sys.argv)>1 else '000000000'
counter = collections.Counter(data)
res = -sum(count/len(data) * math.log2(count/len(data)) for count in counter.values())
print(f'Shannon Entropy: {res:.4f}')
