class ProblemSolver:
    def __init__(self):
        self.problems = {}

    def add_problem(self, problem_name, problem_description):
        self.problems[problem_name] = {"description": problem_description, "sub_problems": []}

    def add_sub_problem(self, problem_name, sub_problem_name, sub_problem_description):
        if problem_name in self.problems:
            self.problems[problem_name]["sub_problems"].append({"name": sub_problem_name, "description": sub_problem_description, "tasks": []})
        else:
            print("Problem not found.")

    def add_task(self, problem_name, sub_problem_name, task_description):
        if problem_name in self.problems:
            for sub_problem in self.problems[problem_name]["sub_problems"]:
                if sub_problem["name"] == sub_problem_name:
                    sub_problem["tasks"].append(task_description)
                    break
            else:
                print("Sub-problem not found.")
        else:
            print("Problem not found.")

    def print_problem(self, problem_name):
        if problem_name in self.problems:
            print(f"Problem: {problem_name}")
            print(f"Description: {self.problems[problem_name]['description']}")
            for sub_problem in self.problems[problem_name]["sub_problems"]:
                print(f"Sub-problem: {sub_problem['name']}")
                print(f"Description: {sub_problem['description']}")
                for task in sub_problem["tasks"]:
                    print(f"Task: {task}")
        else:
            print("Problem not found.")


def main():
    problem_solver = ProblemSolver()
    while True:
        print("1. Add problem")
        print("2. Add sub-problem")
        print("3. Add task")
        print("4. Print problem")
        print("5. Exit")
        choice = input("Enter your choice: ")
        if choice == "1":
            problem_name = input("Enter problem name: ")
            problem_description = input("Enter problem description: ")
            problem_solver.add_problem(problem_name, problem_description)
        elif choice == "2":
            problem_name = input("Enter problem name: ")
            sub_problem_name = input("Enter sub-problem name: ")
            sub_problem_description = input("Enter sub-problem description: ")
            problem_solver.add_sub_problem(problem_name, sub_problem_name, sub_problem_description)
        elif choice == "3":
            problem_name = input("Enter problem name: ")
            sub_problem_name = input("Enter sub-problem name: ")
            task_description = input("Enter task description: ")
            problem_solver.add_task(problem_name, sub_problem_name, task_description)
        elif choice == "4":
            problem_name = input("Enter problem name: ")
            problem_solver.print_problem(problem_name)
        elif choice == "5":
            break
        else:
            print("Invalid choice.")

if __name__ == "__main__":
    main()