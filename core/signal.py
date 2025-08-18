class Signal:
    """Represents a basic digital signal (wire) with history of values over time."""

    def __init__(self, name: str = 'Wire', init: int = 0):
        self.name = name      # signal name (for identification)
        self.value = init     # current value (0 or 1)
        self.history = [init] # list of values over simulation time

    def set(self, new_val: int):
        """Set a new value to the signal and log it in history."""
        if new_val not in (0, 1):
            raise ValueError("Signal value must be 0 or 1")
        self.value = new_val
        self.history.append(new_val)

    def get(self) -> int:
        """Return the current value of the signal."""
        return self.value

    def tick(self):
        """Advance one simulation step without changing value (repeat last)."""
        self.history.append(self.value)

    def __repr__(self):
        return f"Signal({self.name}={self.value})"
