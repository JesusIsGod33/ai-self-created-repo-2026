#!/home/infuselink/yaz_env/bin/python3
import os
import sys

tools = {
    "SysInfoDump": "import os, platform; print(f'OS: {os.name}\\nPlatform: {platform.system()} {platform.release()}\\nMachine: {platform.machine()}\\nNode: {platform.node()}')",
    "NetworkInterfaces": "import os; print(os.popen('ip addr show').read() if os.name == 'posix' else 'ifconfig')",
    "ActiveConnections": "import os; print(os.popen('ss -tuln').read() if os.name == 'posix' else 'netstat')",
    "EnvDump": "import os; [print(f'{k}={v}') for k,v in os.environ.items() if 'KEY' not in k]",
    "CpuMetrics": "import os; print(os.popen('cat /proc/cpuinfo | grep \"model name\" | head -n 1').read() if os.path.exists('/proc/cpuinfo') else 'CPU Info Unavailable')",
    "MemMetrics": "import os; print(os.popen('free -h').read() if os.name == 'posix' else 'Memory Info Unavailable')",
    "DiskMetrics": "import os; print(os.popen('df -h /').read() if os.name == 'posix' else 'Disk Info Unavailable')",
    "UptimeMonitor": "import os; print(os.popen('uptime -p').read() if os.name == 'posix' else 'Uptime Unavailable')",
    "LoadAverage": "import os; print(os.popen('cat /proc/loadavg').read() if os.path.exists('/proc/loadavg') else 'Load Avg Unavailable')",
    "LogTailer": "import os; print(os.popen('tail -n 20 /var/log/dpkg.log 2>/dev/null || echo \"Requires Sudo or file missing\"').read())",
    "PortScanner": "import socket, sys\ntarget = sys.argv[1] if len(sys.argv)>1 else '127.0.0.1'\nprint(f'Scanning {target}...')\nfor p in [22,80,443,8080,25565]:\n s=socket.socket(socket.AF_INET, socket.SOCK_STREAM); s.settimeout(0.2)\n if s.connect_ex((target,p))==0: print(f'Port {p}: OPEN')\n s.close()",
    "DnsLookup": "import socket, sys\ntarget = sys.argv[1] if len(sys.argv)>1 else 'google.com'\ntry: print(f'{target} -> {socket.gethostbyname(target)}')\nexcept Exception as e: print(f'DNS Failed: {e}')",
    "PingSweep": "import os, sys\ntarget = sys.argv[1] if len(sys.argv)>1 else '8.8.8.8'\nprint(os.popen(f'ping -c 3 {target}').read())",
    "PublicIp": "import urllib.request\ntry: print('Public IP:', urllib.request.urlopen('https://api.ipify.org', timeout=5).read().decode())\nexcept Exception as e: print('IP Fetch Failed:', e)",
    "MacGenerator": "import random; print('Generated MAC:', ':'.join(['%02x'%x for x in [0x00, 0x16, 0x3e, random.randint(0x00, 0x7f), random.randint(0x00, 0xff), random.randint(0x00, 0xff)]]))",
    "PassGen": "import random, string, sys\nlength = int(sys.argv[1]) if len(sys.argv)>1 else 16\nprint('Password:', ''.join(random.choices(string.ascii_letters + string.digits + '!@#$%^&*', k=length)))",
    "HashMD5": "import hashlib, sys\ndata = sys.argv[1] if len(sys.argv)>1 else 'YAZ'\nprint('MD5:', hashlib.md5(data.encode()).hexdigest())",
    "HashSHA256": "import hashlib, sys\ndata = sys.argv[1] if len(sys.argv)>1 else 'YAZ'\nprint('SHA256:', hashlib.sha256(data.encode()).hexdigest())",
    "Base64Encode": "import base64, sys\ndata = sys.argv[1] if len(sys.argv)>1 else 'YAZ'\nprint('B64-Enc:', base64.b64encode(data.encode()).decode())",
    "Base64Decode": "import base64, sys\ndata = sys.argv[1] if len(sys.argv)>1 else 'V1VMRg=='\ntry: print('B64-Dec:', base64.b64decode(data.encode()).decode())\nexcept: print('Invalid Base64')",
    "UrlEncode": "import urllib.parse, sys\ndata = sys.argv[1] if len(sys.argv)>1 else 'https://yaz.ai/?q=test'\nprint('URL-Enc:', urllib.parse.quote_plus(data))",
    "UrlDecode": "import urllib.parse, sys\ndata = sys.argv[1] if len(sys.argv)>1 else 'https%3A%2F%2Fyaz.ai%2F%3Fq%3Dtest'\nprint('URL-Dec:', urllib.parse.unquote_plus(data))",
    "HtmlEscape": "import html, sys\ndata = sys.argv[1] if len(sys.argv)>1 else '<script>alert(1)</script>'\nprint('Escaped:', html.escape(data))",
    "JsonValidator": "import json, sys\ndata = sys.argv[1] if len(sys.argv)>1 else '{\"valid\": true}'\ntry:\n json.loads(data)\n print('Valid JSON')\nexcept Exception as e: print('Invalid JSON:', e)",
    "RegexTester": "import re, sys\npattern = sys.argv[1] if len(sys.argv)>1 else '^[a-z]+$'\nstring = sys.argv[2] if len(sys.argv)>2 else 'test'\nprint('Match:', bool(re.match(pattern, string)))",
    "JwtDecoder": "import base64, json, sys\ntoken = sys.argv[1] if len(sys.argv)>1 else 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.sig'\ntry:\n payload = token.split('.')[1]\n padded = payload + '=' * (-len(payload) % 4)\n print('JWT Payload:', base64.urlsafe_b64decode(padded).decode())\nexcept Exception as e: print('JWT Decode Failed:', e)",
    "EpochConverter": "import time, sys\ntry:\n if len(sys.argv)>1: print(time.ctime(int(sys.argv[1])))\n else: print('Current Epoch:', int(time.time()))\nexcept: print('Invalid Epoch')",
    "FileSearcher": "import os, sys\npattern = sys.argv[1] if len(sys.argv)>1 else '.py'\npath = os.path.expanduser('~/yaz_workspace')\nres = []\nfor r, d, f in os.walk(path):\n for file in f:\n  if pattern in file: res.append(os.path.join(r, file))\nprint(f'Found {len(res)} files matching \"{pattern}\". Top 5:')\nfor x in res[:5]: print(x)",
    "DirTreeGenerator": "import os\npath = os.path.expanduser('~/yaz_workspace/tools')\nprint(f'Tree of {path}:')\nfor r, d, f in os.walk(path):\n level = r.replace(path, '').count(os.sep)\n indent = ' ' * 4 * level\n print(f'{indent}{os.path.basename(r)}/')\n subindent = ' ' * 4 * (level + 1)\n for file in f[:2]: print(f'{subindent}{file}')",
    "SslCertChecker": "import ssl, socket, sys, datetime\ntarget = sys.argv[1] if len(sys.argv)>1 else 'google.com'\ntry:\n ctx = ssl.create_default_context()\n with ctx.wrap_socket(socket.socket(), server_hostname=target) as s:\n  s.settimeout(3.0)\n  s.connect((target, 443))\n  cert = s.getpeercert()\n  print(f'Issuer: {cert.get(\"issuer\")[1][0][1]}')\n  print(f'Expires: {cert.get(\"notAfter\")}')\nexcept Exception as e: print('SSL Check Failed:', e)"
}

def forge():
    base_dir = os.path.expanduser("~/yaz_workspace/tools/managers/")
    os.makedirs(base_dir, exist_ok=True)
    count = 0
    for name, code in tools.items():
        file_path = os.path.join(base_dir, f"{name}.py")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(f"#!/home/infuselink/yaz_env/bin/python3\n{code}\n")
        os.chmod(file_path, 0o755)
        count += 1
    print(f"[FORGE] Successfully crafted {count} functional real-world utilities.")

if __name__ == "__main__":
    forge()
