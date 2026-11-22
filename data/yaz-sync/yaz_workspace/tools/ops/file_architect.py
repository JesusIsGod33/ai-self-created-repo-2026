#!/home/infuselink/yaz_env/bin/python3
import os, json, sys

class FileArchitect:
    def create_file(self, path, content, executable=True):
        full_path = os.path.expanduser(os.path.join("~/yaz_workspace/tools/managers/", path))
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w') as f:
            f.write(content)
        if executable:
            os.chmod(full_path, 0o755)
        return f"[SUCCESS] Architected: {full_path}"

if __name__ == '__main__':
    try:
        payload = json.load(sys.stdin)
        architect = FileArchitect()
        print(architect.create_file(payload['path'], payload['content']))
    except Exception as e:
        print(f"[ERROR] Architect failure: {e}")
