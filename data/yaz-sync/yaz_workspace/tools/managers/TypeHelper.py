import importlib
import typing

class TypeHelper:
    def get_type(self, type_name):
        try:
            # Check if the type is a built-in type
            built_in_types = {
                "int": int,
                "str": str,
                "float": float,
                "bool": bool,
                "list": list,
                "dict": dict,
                "tuple": tuple,
                "set": set
            }
            if type_name in built_in_types:
                return built_in_types[type_name]
            # If not a built-in type, try to import it from the typing module
            module = importlib.import_module(f"typing")
            return getattr(module, type_name)
        except AttributeError:
            raise TypeError(f"Unknown type: {type_name}")

    def is_compatible(self, type_name):
        type_module = self.get_type(type_name)
        # Add your compatibility logic here
        return True

type_helper = TypeHelper()
print(type_helper.is_compatible("int"))