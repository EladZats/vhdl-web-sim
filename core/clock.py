# core/clock.py

from .signal import Signal

class Clock:
    """Represents a clock signal that toggles between 0 and 1."""

    def __init__(self, name: str, period: int = 2):
        self.signal = Signal(name, 0)  # clock starts at 0
        self.period = period           # number of steps for a full cycle
        self.counter = 0

    def tick(self):
        """Advance the clock by one step and toggle if needed."""
        self.counter += 1
        if self.counter >= self.period // 2:
            # toggle the value
            new_val = 0 if self.signal.get() == 1 else 1
            self.signal.set(new_val)
            self.counter = 0

    def get(self) -> int:
        """Return the current value of the clock signal."""
        return self.signal.get()

    def __repr__(self):
        return f"Clock({self.signal.name}={self.signal.get()})"
