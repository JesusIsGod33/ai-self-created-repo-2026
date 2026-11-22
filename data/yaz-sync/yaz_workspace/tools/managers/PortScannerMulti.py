import socket
import sys

def scan_ports(hosts, ports):
    for host in hosts:
        print(f'Scanning {host}...')
        for port in ports:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.2)
            if s.connect_ex((host, port)) == 0:
                print(f'Port {port}: OPEN on {host}')
            s.close()

if __name__ == '__main__':
    hosts = ['example.com', 'example.org', 'example.net']
    ports = [22, 80, 443, 8080, 25565]
    scan_ports(hosts, ports)