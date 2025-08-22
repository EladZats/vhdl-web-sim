class Signal:
    """Represents a wire in the circuit that carries a value."""

    def __init__(self, name: str, value: int = 0):
        self.name = name
        self.value = value

    def set_value(self, new_value: int):
        """Sets the signal's current value."""
        self.value = new_value

    def get_value(self) -> int:
        """Gets the signal's current value."""
        return self.value

    def __repr__(self):
        return f"Signal({self.name}={self.value})"
