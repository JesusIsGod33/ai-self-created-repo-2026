class ManagerRegistry:
    def __init__(self):
        self.managers = {}

    def register_manager(self, manager_name, manager_class):
        self.managers[manager_name] = manager_class

    def get_manager(self, manager_name):
        return self.managers.get(manager_name)