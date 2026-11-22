class CustomQuadraticProbing:
    def __init__(self, size):
        """
        Initialize the CustomQuadraticProbing class.

        :param size: The size of the hash table.
        """
        self.size = size
        self.table = [None] * size

    def _hash(self, key):
        """
        Calculate the hash value for a given key.

        :param key: The key to be hashed.
        :return: The hashed key.
        """
        return key % self.size

    def insert(self, key, value):
        """
        Insert a key-value pair into the hash table.

        :param key: The key to be inserted.
        :param value: The value associated with the key.
        """
        index = self._hash(key)
        for i in range(self.size):
            quad_index = (index + i ** 2) % self.size
            if self.table[quad_index] is None:
                self.table[quad_index] = (key, value)
                return
            elif self.table[quad_index][0] == key:
                self.table[quad_index] = (key, value)
                return

    def search(self, key):
        """
        Search for a key in the hash table.

        :param key: The key to be searched.
        :return: The value associated with the key if found, otherwise None.
        """
        index = self._hash(key)
        for i in range(self.size):
            quad_index = (index + i ** 2) % self.size
            if self.table[quad_index] is None:
                return None
            elif self.table[quad_index][0] == key:
                return self.table[quad_index][1]

    def delete(self, key):
        """
        Delete a key-value pair from the hash table.

        :param key: The key to be deleted.
        """
        index = self._hash(key)
        for i in range(self.size):
            quad_index = (index + i ** 2) % self.size
            if self.table[quad_index] is None:
                return
            elif self.table[quad_index][0] == key:
                self.table[quad_index] = None
                return