#!/home/infuselink/yaz_env/bin/python3
import ipaddress, sys
target = sys.argv[1] if len(sys.argv)>1 else '192.168.1.0/24'
try:
 net = ipaddress.ip_network(target, strict=False)
 print(f'Network: {net}\nNetmask: {net.netmask}\nBroadcast: {net.broadcast_address}\nHosts: {net.num_addresses}')
except Exception as e: print(e)
