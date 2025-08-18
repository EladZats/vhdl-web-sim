class Signal:
    #Represents a basic digital signal (wire) with a binary value

    def __init__(self, name: str = 'Wire', init: int = 0):
        self.name = name      # signal name (for identification)
        self.value = init     # current value (0 or 1)

    def set(self, new_val: int):
        #Set a new value to the signal.
        if new_val not in (0, 1):
            raise ValueError("Signal value must be 0 or 1")
        self.value = new_val

    def get(self) -> int:
        #Return the current value of the signal."""
        return self.value

    def __repr__(self):
        return f"Signal({self.name}={self.value})"
