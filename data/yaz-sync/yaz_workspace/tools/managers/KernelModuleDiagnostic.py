import subprocess

def get_kernel_version():
    """Get the kernel version."""
    return subprocess.check_output(['uname', '-r']).decode('utf-8').strip()

def get_loaded_modules():
    """Get the list of loaded kernel modules."""
    try:
        return subprocess.check_output(['lsmod']).decode('utf-8').splitlines()
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        return []

def check_module(module_name):
    """Check if a kernel module is loaded."""
    try:
        subprocess.check_output(['modprobe', '-n', module_name])
        return True
    except subprocess.CalledProcessError:
        return False

def main():
    kernel_version = get_kernel_version()
    print(f"Kernel Version: {kernel_version}")

    loaded_modules = get_loaded_modules()
    print("Loaded Modules:")
    for module in loaded_modules:
        print(module)

    module_names = ['loop', 'tcp_loop', 'veth']
    for module_name in module_names:
        if check_module(module_name):
            print(f"Module {module_name} is loaded.")
        else:
            print(f"Module {module_name} is not loaded.")

if __name__ == "__main__":
    main()