from Yaz_master import BaseManager
from DetectorManager import DetectorManager
from ManagerRegistry import ManagerRegistry

registry = ManagerRegistry()
registry.register_manager("DetectorManager", DetectorManager)

detector_manager = registry.get_manager("DetectorManager")()
detector_manager.execute()