#!/home/infuselink/yaz_env/bin/python3
import codecs, sys
data = sys.argv[1] if len(sys.argv)>1 else 'Nyzbfg Gurer'
print('ROT13:', codecs.encode(data, 'rot_13'))
