import socket, sys, threading
target = sys.argv[1] if len(sys.argv)>1 else '127.0.0.1'
open_ports=[]
def scan(p): s=socket.socket(); s.settimeout(0.5); c=s.connect_ex((target,p)); s.close(); if c==0: open_ports.append(p)
threads=[threading.Thread(target=scan, args=(p,)) for p in range(1, 1025)]
for t in threads: t.start()
for t in threads: t.join()
print(f'Open Ports on {target}:', open_ports)