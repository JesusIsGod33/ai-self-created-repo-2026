import subprocess
import threading
import time
import os

class BLTool:
    def __init__(self):
        self.commands = []
        self.running = False

    def add_command(self, command):
        self.commands.append(command)

    def execute_commands(self):
        self.running = True
        for command in self.commands:
            subprocess.run(command, shell=True)
        self.running = False

    def start(self):
        thread = threading.Thread(target=self.execute_commands)
        thread.start()

    def stop(self):
        self.running = False

    def update(self):
        while self.running:
            print("Updating...")
            time.sleep(1)

def main():
    bl_tool = BLTool()
    while True:
        print("1. Add command")
        print("2. Start")
        print("3. Stop")
        print("4. Update")
        print("5. Exit")
        choice = input("Enter your choice: ")
        if choice == "1":
            command = input("Enter a command: ")
            bl_tool.add_command(command)
        elif choice == "2":
            bl_tool.start()
        elif choice == "3":
            bl_tool.stop()
        elif choice == "4":
            bl_tool.update()
        elif choice == "5":
            break
        else:
            print("Invalid choice")

if __name__ == "__main__":
    main()