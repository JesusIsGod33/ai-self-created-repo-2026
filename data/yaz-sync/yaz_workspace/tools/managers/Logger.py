import logging

class Logger:
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def log_event(self, event: str, *args, **kwargs):
        self.logger.info(f"Event emitted: {event} with args: {args} and kwargs: {kwargs}")

    def log_listener(self, listener: Callable, *args, **kwargs):
        self.logger.info(f"Listener executed: {listener.__name__} with args: {args} and kwargs: {kwargs}")

# Example usage:
logger = Logger()
logger.log_event("my_event", "Hello, world!")
logger.log_listener(my_listener, "Hello, world!")