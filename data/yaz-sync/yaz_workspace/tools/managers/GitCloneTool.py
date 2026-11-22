import os

class GitCloneTool:
    def __init__(self, repo_url, dest_dir):
        self.repo_url = repo_url
        self.dest_dir = dest_dir

    def clone_repo(self):
        # Remove the force option from the git clone command
        clone_cmd = f"git clone {self.repo_url} {self.dest_dir}"
        os.system(clone_cmd)

    def stage_and_commit(self):
        # Ensure the destination directory exists before trying to change to it
        if not os.path.exists(self.dest_dir):
            os.makedirs(self.dest_dir)
        os.chdir(self.dest_dir)
        # Rest of your code here

# Example usage:
tool = GitCloneTool("https://github.com/username/repo.git", "botcircuits-argus")
tool.clone_repo()
tool.stage_and_commit()