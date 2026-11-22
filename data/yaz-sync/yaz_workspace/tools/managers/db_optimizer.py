import os
import sqlite3
import shutil
import logging
import datetime

# Setup logging
log_dir = os.path.expanduser("~/yaz_workspace/logs")
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    filename=os.path.join(log_dir, "db_optimizer.log"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

class DbOptimizer:
    def __init__(self):
        self.db_path = os.path.expanduser("~/.yaz_omni_v52.db")
        self.backup_dir = os.path.expanduser("~/yaz_workspace/backups")
        os.makedirs(self.backup_dir, exist_ok=True)

    def backup_database(self):
        if not os.path.exists(self.db_path):
            logging.error("Database file not found. Skipping backup.")
            return False
        
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"yaz_omni_backup_{timestamp}.db"
        backup_path = os.path.join(self.backup_dir, backup_filename)
        
        try:
            shutil.copy2(self.db_path, backup_path)
            logging.info(f"Database backed up successfully to: {backup_path}")
            return True
        except Exception as e:
            logging.error(f"Database backup failed: {e}")
            return False

    def optimize_database(self):
        if not os.path.exists(self.db_path):
            return
        
        initial_size = os.path.getsize(self.db_path)
        logging.info(f"Initial DB Size: {initial_size / (1024*1024):.2f} MB. Executing optimization...")

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Execute VACUUM to reclaim unused disk space
            conn.execute("VACUUM")
            
            # Execute ANALYZE to update statistics for query plan optimizations
            conn.execute("ANALYZE")
            
            # Re-index tables to clean up fragmented index trees
            conn.execute("REINDEX")
            
            conn.commit()
            conn.close()

            final_size = os.path.getsize(self.db_path)
            saved_space = initial_size - final_size
            logging.info(
                f"Optimization complete. Final DB Size: {final_size / (1024*1024):.2f} MB. "
                f"Reclaimed Space: {saved_space / 1024:.2f} KB."
            )
            print(f"[DB OPT] Vacuum completed. Optimized to {final_size / (1024*1024):.2f} MB.")
        except Exception as e:
            logging.error(f"Database optimization failed: {e}")

if __name__ == "__main__":
    optimizer = DbOptimizer()
    # Back up then optimize
    if optimizer.backup_database():
        optimizer.optimize_database()
