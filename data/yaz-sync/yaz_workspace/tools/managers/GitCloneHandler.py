import subprocess
import time

class GitCloneHandler:
    def __init__(self, repo_url, clone_path):
        self.repo_url = repo_url
        self.clone_path = clone_path
        self.max_retries = 3
        self.retry_delay = 5  # seconds

    def clone_repository(self):
        retry_count = 0
        while retry_count < self.max_retries:
            try:
                subprocess.check_call(['git', 'clone', self.repo_url, self.clone_path])
                print(f"Repository cloned successfully to {self.clone_path}")
                return True
            except subprocess.CalledProcessError as e:
                retry_count += 1
                print(f"Error cloning repository: {e}. Retrying in {self.retry_delay} seconds...")
                time.sleep(self.retry_delay)
        print("Failed to clone repository after retries.")
        return False

# Example usage
if __name__ == "__main__":
    repo_url = "https://github.com/yourusername/botcircuits-argus.git"
    clone_path = "botcircuits-argus"
    handler = GitCloneHandler(repo_url, clone_path)
    handler.clone_repository()