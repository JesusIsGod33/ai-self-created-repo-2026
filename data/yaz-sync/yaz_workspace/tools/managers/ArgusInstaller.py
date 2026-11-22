import os
import subprocess
import git

def install_argus():
    # Clone the repository
    repo_url = "https://github.com/<username>/botcircuits-argus.git"
    repo_dir = "botcircuits-argus"
    try:
        git.Repo.clone_from(repo_url, repo_dir)
    except git.exc.GitCommandError as e:
        print(f"Error cloning repository: {e}")
        return

    # Change into the repository directory
    try:
        os.chdir(repo_dir)
    except FileNotFoundError:
        print(f"Directory {repo_dir} not found")
        return

    # Install requirements
    try:
        subprocess.run(["pip", "install", "-r", "requirements.txt"])
    except FileNotFoundError:
        print("Requirements file not found")
        return

    # Install the botcircuits_argus module
    try:
        subprocess.run(["pip", "install", "-e", "."])
    except Exception as e:
        print(f"Error installing module: {e}")
        return

    print("Argus installed successfully")

if __name__ == "__main__":
    install_argus()