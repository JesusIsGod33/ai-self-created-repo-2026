#!/home/infuselink/yaz_env/bin/python3
import random; print('Generated MAC:', ':'.join(['%02x'%x for x in [0x00, 0x16, 0x3e, random.randint(0x00, 0x7f), random.randint(0x00, 0xff), random.randint(0x00, 0xff)]]))
