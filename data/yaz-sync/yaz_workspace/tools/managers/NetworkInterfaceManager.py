import subprocess

def set_interface_up(interface):
    subprocess.run(["ip", "link", "set", interface, "up"])

def set_interface_down(interface):
    subprocess.run(["ip", "link", "set", interface, "down"])

def add_ip_address(interface, ip_address):
    subprocess.run(["ip", "addr", "add", ip_address, "dev", interface])

def remove_ip_address(interface, ip_address):
    subprocess.run(["ip", "addr", "del", ip_address, "dev", interface])

def main():
    print("Network Manager")
    print("1. Set interface up")
    print("2. Set interface down")
    print("3. Add IP address")
    print("4. Remove IP address")
    choice = input("Enter your choice: ")
    
    if choice == "1":
        interface = input("Enter interface name: ")
        set_interface_up(interface)
    elif choice == "2":
        interface = input("Enter interface name: ")
        set_interface_down(interface)
    elif choice == "3":
        interface = input("Enter interface name: ")
        ip_address = input("Enter IP address: ")
        add_ip_address(interface, ip_address)
    elif choice == "4":
        interface = input("Enter interface name: ")
        ip_address = input("Enter IP address: ")
        remove_ip_address(interface, ip_address)
    else:
        print("Invalid choice. Please choose a valid option.")

if __name__ == "__main__":
    main()