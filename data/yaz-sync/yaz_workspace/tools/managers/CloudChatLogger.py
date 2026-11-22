import os
import logging
from logging.handlers import RotatingFileHandler
import datetime
import json

class CloudChatLogger:
    def __init__(self, chat_id):
        self.chat_id = chat_id
        self.log_dir = "/home/infuselink/yaz_workspace/logs/cloud_chats"
        self.log_file = f"{self.log_dir}/{self.chat_id}.log"
        self.logger = logging.getLogger(self.chat_id)
        self.logger.setLevel(logging.INFO)
        self.handler = RotatingFileHandler(self.log_file, maxBytes=1000000, backupCount=5)
        self.handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
        self.logger.addHandler(self.handler)

    def log_message(self, message):
        self.logger.info(message)

    def get_log(self):
        with open(self.log_file, 'r') as f:
            log_data = f.read()
        return log_data

    def upload_log_to_cloud(self):
        # Upload log to cloud using cloud_migration_pilot.py
        from cloud_migration_pilot import CloudCopilot
        cloud_copilot = CloudCopilot()
        cloud_copilot.deploy_cloud_bridge("cloud_storage_endpoint")
        # Upload log file to cloud
        with open(self.log_file, 'r') as f:
            log_data = f.read()
        cloud_copilot.sync_workspace("cloud_storage_endpoint")
        return "Log uploaded to cloud"

# Create a new instance of CloudChatLogger for each chat
def create_chat_logger(chat_id):
    return CloudChatLogger(chat_id)

# Example usage:
chat_id = "chat_123"
logger = create_chat_logger(chat_id)
logger.log_message("This is a test message")
print(logger.get_log())
print(logger.upload_log_to_cloud())