import argparse

class CloudMigrationManager:
    def __init__(self, source, destination):
        self.source = source
        self.destination = destination

    def migrate(self):
        print(f"Migrating from {self.source} to {self.destination}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Cloud Migration Manager")
    parser.add_argument("--source", help="Source location")
    parser.add_argument("--destination", help="Destination location")
    args = parser.parse_args()

    manager = CloudMigrationManager(args.source, args.destination)
    manager.migrate()