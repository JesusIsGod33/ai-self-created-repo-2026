import asyncio
from typing import Callable, Dict

class EventManager:
    def __init__(self):
        self.listeners = {}

    def on(self, event: str, listener: Callable):
        if event not in self.listeners:
            self.listeners[event] = []
        self.listeners[event].append(listener)

    def emit(self, event: str, *args, **kwargs):
        if event in self.listeners:
            for listener in self.listeners[event]:
                listener(*args, **kwargs)

    async def async_emit(self, event: str, *args, **kwargs):
        if event in self.listeners:
            for listener in self.listeners[event]:
                await listener(*args, **kwargs)

# Example usage:
def my_listener(data):
    print(f"Received event data: {data}")

event_manager = EventManager()
event_manager.on("my_event", my_listener)
event_manager.emit("my_event", "Hello, world!")