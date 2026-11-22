import socket

def scan_port(host, port):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex((host, port))
        if result == 0:
            print(f"Port {port} is open on {host}")
        else:
            print(f"Port {port} is closed on {host}")
        sock.close()
    except socket.error as e:
        print(f"Error scanning port {port} on {host}: {e}")

if __name__ == "__main__":
    host = "example.com"
    port = 80
    scan_port(host, port)