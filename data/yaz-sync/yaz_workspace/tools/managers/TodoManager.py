import os
import sys

class TodoManager:
    def __init__(self):
        self.tasks = []

    def add_task(self, task):
        self.tasks.append(task)
        print(f"Task '{task}' added.")

    def view_tasks(self):
        if not self.tasks:
            print("No tasks available.")
        else:
            print("Available tasks:")
            for i, task in enumerate(self.tasks, start=1):
                print(f"{i}. {task}")

    def delete_task(self, task_number):
        try:
            task_number = int(task_number)
            if task_number <= 0:
                print("Invalid task number.")
            elif task_number > len(self.tasks):
                print("Task not found.")
            else:
                task = self.tasks.pop(task_number - 1)
                print(f"Task '{task}' deleted.")
        except ValueError:
            print("Invalid task number.")

def main():
    todo = TodoManager()
    while True:
        print("\n1. Add task")
        print("2. View tasks")
        print("3. Delete task")
        print("4. Exit")
        choice = input("Choose an option: ")
        if choice == "1":
            task = input("Enter a task: ")
            todo.add_task(task)
        elif choice == "2":
            todo.view_tasks()
        elif choice == "3":
            task_number = input("Enter the task number to delete: ")
            todo.delete_task(task_number)
        elif choice == "4":
            break
        else:
            print("Invalid option. Please choose again.")

if __name__ == "__main__":
    main()