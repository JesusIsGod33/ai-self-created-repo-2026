import os, sys
path = sys.argv[1] if len(sys.argv)>1 else os.path.expanduser('~/')
def tree(d, p=''): 
 try: ls=os.listdir(d)
 except: return
 for i, f in enumerate(ls): print(p+('└── ' if i==len(ls)-1 else '├── ')+f); p2=p+('    ' if i==len(ls)-1 else '│   '); tree(os.path.join(d,f), p2) if os.path.isdir(os.path.join(d,f)) else None
print(f'Tree of {path}:'); tree(path)